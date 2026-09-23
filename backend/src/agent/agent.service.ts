import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ProviderRegistryService, AiProviderError } from '../ai/provider-registry.service';
import { AiMessage, AiToolCall, AiToolDefinition } from '../ai/providers/provider.interface';
import { NotificationsService } from '../notifications/notifications.service';
import { isDestructiveCommand } from './destructive-command.util';
import {
  isSecretLikePath,
  redactSecrets,
  resolveWithinWorkspace,
} from './workspace-fs.util';
import { AgentActivityEvent, PendingConfirmation } from './agent.types';

const SHELL = process.platform === 'win32' ? 'powershell.exe' : 'bash';

/** node-pty ships a native binding; require it lazily so an environment where it
 * fails to load (e.g. a serverless runtime) doesn't crash the whole app at import time. */
function loadPty(): typeof import('node-pty') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('node-pty');
}

const MAX_FILE_READ_BYTES = 200_000;
const COMMAND_TIMEOUT_MS = 120_000;

const SYSTEM_PROMPT = `You are an autonomous coding agent working inside a single project folder on the user's machine.

Your job: understand the project, run the requested command(s), detect errors, find the root cause in the source code, propose and apply a fix, then rerun the relevant command to verify the fix actually worked. If it didn't work, keep investigating instead of claiming success.

Rules:
- Only read/write files inside the project root you are given. You cannot access any other folder.
- Never fabricate command output. Only report what tools actually returned.
- Before concluding a task is done, verify by rerunning the relevant command/test and checking its real output.
- If you are not sure the fix worked, say so and keep going.
- Some commands are gated behind human confirmation (destructive operations). If a command is rejected, stop and explain what you wanted to do and why, and ask for guidance.
- Never print or repeat secret values (API keys, passwords, tokens) even if you see them in a file.`;

const TOOLS: AiToolDefinition[] = [
  {
    name: 'list_directory',
    description: 'List files and folders at a path relative to the project root.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Relative path, "." for root' } },
      required: ['path'],
    },
  },
  {
    name: 'read_file',
    description: 'Read a text file relative to the project root.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write/overwrite a text file relative to the project root.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'run_command',
    description:
      'Run a shell command in the project root and return its stdout/stderr/exit code. Destructive commands require human confirmation first.',
    parameters: {
      type: 'object',
      properties: { command: { type: 'string' } },
      required: ['command'],
    },
  },
];

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly activeLoops = new Map<string, boolean>();
  private readonly pendingConfirmations = new Map<string, PendingConfirmation>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly providerRegistry: ProviderRegistryService,
    private readonly notifications: NotificationsService,
  ) {}

  isRunning(sessionId: string): boolean {
    return this.activeLoops.get(sessionId) === true;
  }

  stop(sessionId: string): void {
    this.activeLoops.set(sessionId, false);
  }

  resolveConfirmation(confirmationId: string, approved: boolean): void {
    const pending = this.pendingConfirmations.get(confirmationId);
    if (pending) {
      pending.resolve(approved);
      this.pendingConfirmations.delete(confirmationId);
    }
  }

  async runGoal(
    userId: string,
    sessionId: string,
    goal: string,
    emit: (event: AgentActivityEvent) => void,
  ): Promise<void> {
    const session = await this.prisma.agentSession.findFirst({
      where: { id: sessionId, userId },
      include: { workspace: true },
    });
    if (!session) {
      throw new Error('Session not found');
    }

    const userSettings = await this.settings.getOrCreateRaw(userId);
    const userApiKeys = (userSettings.apiKeys as Record<string, string> | null) ?? {};

    let resolved: ReturnType<ProviderRegistryService['resolve']>;
    try {
      resolved = this.providerRegistry.resolve(userSettings.modelSelection, userApiKeys);
    } catch (err) {
      const message =
        err instanceof AiProviderError
          ? err.message
          : 'Failed to resolve the selected AI model/provider.';
      emit(this.event(sessionId, 'error', { message }));
      await this.notifications.notifySessionOutcome(userId, sessionId, 'failed', message);
      return;
    }

    const { provider, apiKey } = resolved;
    const model = userSettings.modelSelection;
    const workspaceRoot = session.workspace.pathOrRepoUrl;

    this.activeLoops.set(sessionId, true);
    let nextOrder = (await this.prisma.sessionStep.count({ where: { sessionId } })) + 1;

    const recordStep = async (
      type: string,
      fields: { command?: string; output?: string; exitStatus?: number },
    ) => {
      await this.prisma.sessionStep.create({
        data: { sessionId, order: nextOrder++, type, ...fields },
      });
    };

    let messages: AiMessage[] = [{ role: 'user', content: goal }];
    const startedAt = Date.now();
    const maxSteps = userSettings.maxStepsPerTask;
    const maxRuntimeMs = userSettings.maxRuntimeSeconds * 1000;

    let step = 0;
    let outcome: 'completed' | 'failed' = 'completed';
    let outcomeDetail = 'The agent finished the requested task.';
    try {
      while (this.isRunning(sessionId) && step < maxSteps) {
        if (Date.now() - startedAt > maxRuntimeMs) {
          emit(this.event(sessionId, 'error', { message: 'Max runtime exceeded for this task.' }));
          outcome = 'failed';
          outcomeDetail = 'Max runtime exceeded for this task.';
          break;
        }
        step += 1;

        const result = await provider.generateResponse(apiKey, {
          model,
          systemPrompt: SYSTEM_PROMPT,
          tools: TOOLS,
          messages,
        });

        if (result.text) {
          emit(this.event(sessionId, 'thinking', { text: result.text }));
        }

        if (result.toolCalls.length === 0) {
          emit(this.event(sessionId, 'done', { message: 'Agent finished without further tool calls.' }));
          outcomeDetail = result.text || outcomeDetail;
          break;
        }

        messages = [...messages, { role: 'assistant', content: result.text, toolCalls: result.toolCalls }];

        for (const toolCall of result.toolCalls) {
          const output = await this.executeTool(
            sessionId,
            workspaceRoot,
            toolCall,
            userSettings.confirmationRequired,
            emit,
            recordStep,
          );
          messages.push({ role: 'tool', toolCallId: toolCall.id, content: output });
        }
      }
    } catch (err) {
      this.logger.error('Agent loop failed', err as Error);
      outcome = 'failed';
      outcomeDetail = (err as Error).message;
      emit(this.event(sessionId, 'error', { message: outcomeDetail }));
    } finally {
      this.activeLoops.set(sessionId, false);
      await this.notifications.notifySessionOutcome(userId, sessionId, outcome, outcomeDetail);
    }
  }

  private async executeTool(
    sessionId: string,
    workspaceRoot: string,
    toolCall: AiToolCall,
    confirmationRequired: boolean,
    emit: (event: AgentActivityEvent) => void,
    recordStep: (type: string, fields: { command?: string; output?: string; exitStatus?: number }) => Promise<void>,
  ): Promise<string> {
    let input: Record<string, unknown>;
    try {
      input = JSON.parse(toolCall.arguments) as Record<string, unknown>;
    } catch {
      return 'Error: invalid tool arguments JSON';
    }

    try {
      switch (toolCall.name) {
        case 'list_directory': {
          const target = resolveWithinWorkspace(workspaceRoot, String(input.path ?? '.'));
          const entries = await readdir(target, { withFileTypes: true });
          const listing = entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
          emit(this.event(sessionId, 'list_directory', { path: input.path, entries: listing }));
          return listing.join('\n') || '(empty)';
        }

        case 'read_file': {
          const relPath = String(input.path ?? '');
          if (isSecretLikePath(relPath)) {
            emit(this.event(sessionId, 'read_file', { path: relPath, blocked: true }));
            return 'Access denied: this file may contain secrets and cannot be read by the agent.';
          }
          const target = resolveWithinWorkspace(workspaceRoot, relPath);
          const info = await stat(target);
          if (info.size > MAX_FILE_READ_BYTES) {
            return 'File too large to read.';
          }
          const content = await readFile(target, 'utf-8');
          const safe = redactSecrets(content);
          emit(this.event(sessionId, 'read_file', { path: relPath }));
          return safe;
        }

        case 'write_file': {
          const relPath = String(input.path ?? '');
          const content = String(input.content ?? '');
          if (isSecretLikePath(relPath)) {
            emit(this.event(sessionId, 'proposed_change', { path: relPath, blocked: true }));
            return 'Access denied: cannot write to this path.';
          }

          emit(this.event(sessionId, 'proposed_change', { path: relPath, content }));

          const target = resolveWithinWorkspace(workspaceRoot, relPath);
          await writeFile(target, content, 'utf-8');
          emit(this.event(sessionId, 'file_written', { path: relPath }));
          await recordStep('file_written', { output: relPath });
          return `Wrote ${relPath}`;
        }

        case 'run_command': {
          const command = String(input.command ?? '');

          if (confirmationRequired && isDestructiveCommand(command)) {
            const approved = await this.requestConfirmation(sessionId, 'command', command, emit);
            if (!approved) {
              return 'User rejected this command. Do not attempt it again; ask for a different approach.';
            }
          }

          emit(this.event(sessionId, 'command', { command }));
          await recordStep('command', { command });

          const { output, exitCode } = await this.runShellCommand(workspaceRoot, command);
          const safeOutput = redactSecrets(output);
          emit(this.event(sessionId, 'command_output', { command, output: safeOutput, exitCode }));
          await recordStep('command_output', { output: safeOutput, exitStatus: exitCode });

          return `exit code: ${exitCode}\n\n${safeOutput}`;
        }

        default:
          return `Unknown tool: ${toolCall.name}`;
      }
    } catch (err) {
      const message = (err as Error).message;
      emit(this.event(sessionId, 'error', { message, tool: toolCall.name }));
      return `Error: ${message}`;
    }
  }

  private requestConfirmation(
    sessionId: string,
    kind: 'command' | 'file_write',
    description: string,
    emit: (event: AgentActivityEvent) => void,
  ): Promise<boolean> {
    const id = randomUUID();
    emit(this.event(sessionId, 'confirmation_required', { confirmationId: id, kind, description }));

    return new Promise<boolean>((resolve) => {
      this.pendingConfirmations.set(id, { id, sessionId, kind, description, resolve });
    });
  }

  private runShellCommand(
    cwd: string,
    command: string,
  ): Promise<{ output: string; exitCode: number }> {
    return new Promise((resolve) => {
      let pty: typeof import('node-pty');
      try {
        pty = loadPty();
      } catch (err) {
        this.logger.error('node-pty is unavailable in this environment', err as Error);
        resolve({
          output:
            '[Shell command execution is unavailable in this environment. This feature requires a host with native PTY support.]',
          exitCode: 1,
        });
        return;
      }

      let output = '';
      const shell = pty.spawn(SHELL, [], { name: 'xterm-color', cols: 100, rows: 30, cwd });

      const timeout = setTimeout(() => {
        shell.kill();
        resolve({ output: output + '\n[Command timed out]', exitCode: 124 });
      }, COMMAND_TIMEOUT_MS);

      shell.onData((data) => {
        output += data;
      });

      shell.onExit(({ exitCode }) => {
        clearTimeout(timeout);
        resolve({ output, exitCode });
      });

      shell.write(`${command}\r`);
      shell.write('exit $LASTEXITCODE\r');
    });
  }

  private event(
    sessionId: string,
    type: AgentActivityEvent['type'],
    payload: Record<string, unknown>,
  ): AgentActivityEvent {
    return { sessionId, type, payload, createdAt: new Date().toISOString() };
  }
}
