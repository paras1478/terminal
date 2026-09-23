import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentGateway } from '../agent/agent.gateway';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { PaginatedSessionsResponseDto } from './dto/session-summary-response.dto';
import { SessionDetailResponseDto } from './dto/session-detail-response.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { TerminalGateway } from './terminal.gateway';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly terminalGateway: TerminalGateway,
    private readonly agentGateway: AgentGateway,
  ) {}

  async list(
    userId: string,
    query: ListSessionsQueryDto,
  ): Promise<PaginatedSessionsResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.agentSession.findMany({
        where,
        include: { workspace: true },
        orderBy: { lastActivityAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.agentSession.count({ where }),
    ]);

    return {
      items: items.map((session) => ({
        id: session.id,
        workspaceId: session.workspaceId,
        workspaceName: session.workspace.name,
        goal: session.goal,
        status: session.status,
        startedAt: session.startedAt,
        durationSeconds: session.completedAt
          ? Math.round(
              (session.completedAt.getTime() - session.startedAt.getTime()) /
                1000,
            )
          : null,
        commandsCount: session.commandsCount,
        lastActivityAt: session.lastActivityAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<SessionDetailResponseDto> {
    // dto.path is a label supplied by the client identifying a workspace on the
    // USER'S OWN machine (a local folder in Electron, or a repo URL). The backend
    // never validates it against a filesystem — it may be running on a different
    // machine (e.g. Render) entirely and has no way to see the user's local disk.
    // All actual file I/O and PTY execution happen in Electron, which receives
    // this same identifier back and resolves it locally. See ADR note in
    // electron/src/main.js's workspace IPC handlers.
    const normalizedPath = dto.path.trim().replace(/[\\/]+$/, '');

    const workspaceName =
      dto.name?.trim() || normalizedPath.split(/[\\/]/).pop() || normalizedPath;

    const workspace = await this.prisma.workspace.upsert({
      where: { userId_pathOrRepoUrl: { userId, pathOrRepoUrl: normalizedPath } },
      update: {},
      create: {
        userId,
        name: workspaceName,
        pathOrRepoUrl: normalizedPath,
        languageStack: 'Unknown',
        recentActivity: 'Workspace created',
      },
    });

    const session = await this.prisma.agentSession.create({
      data: {
        userId,
        workspaceId: workspace.id,
        goal: dto.goal,
        agentType: dto.agentType,
        plan: {},
      },
      include: { workspace: true },
    });

    return {
      id: session.id,
      workspaceId: session.workspaceId,
      workspaceName: session.workspace.name,
      workspacePath: session.workspace.pathOrRepoUrl,
      goal: session.goal,
      status: session.status,
      plan: session.plan,
      timeline: [],
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      commandsCount: session.commandsCount,
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const session = await this.prisma.agentSession.findFirst({
      where: { id, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    this.terminalGateway.terminateSession(id);
    this.agentGateway.terminateSession(id);

    // SessionStep cascades (onDelete: Cascade) and CommandLog.sessionId is
    // nulled (onDelete: SetNull) automatically per the Prisma schema —
    // command log history is preserved on the workspace.
    await this.prisma.agentSession.delete({ where: { id } });
  }

  async getDetail(
    userId: string,
    id: string,
  ): Promise<SessionDetailResponseDto> {
    const session = await this.prisma.agentSession.findFirst({
      where: { id, userId },
      include: {
        workspace: true,
        steps: { orderBy: { order: 'asc' } },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      id: session.id,
      workspaceId: session.workspaceId,
      workspaceName: session.workspace.name,
      workspacePath: session.workspace.pathOrRepoUrl,
      goal: session.goal,
      status: session.status,
      plan: session.plan,
      timeline: session.steps.map((step) => ({
        order: step.order,
        type: step.type,
        command: step.command ?? undefined,
        output: step.output ?? undefined,
        exitStatus: step.exitStatus ?? undefined,
        createdAt: step.createdAt,
      })),
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      commandsCount: session.commandsCount,
    };
  }
}
