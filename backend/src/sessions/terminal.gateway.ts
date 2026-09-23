import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { existsSync } from 'fs';
import type { IPty } from 'node-pty';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PrismaService } from '../prisma/prisma.service';

const SHELL = process.platform === 'win32' ? 'powershell.exe' : 'bash';

/** node-pty ships a native binding; require it lazily so an environment where it
 * fails to load (e.g. a serverless runtime) doesn't crash the whole app at import time. */
function loadPty(): typeof import('node-pty') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('node-pty');
}

@WebSocketGateway({
  namespace: 'terminal',
  cors: { origin: process.env.CORS_ORIGIN ?? 'https://terminal-1-riuw.onrender.com', credentials: true },
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TerminalGateway.name);
  private readonly ptyBySocket = new Map<string, IPty>();
  private readonly socketsBySession = new Map<string, Set<string>>();
  private readonly sessionBySocket = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const sessionId = client.handshake.query?.sessionId as string | undefined;

      if (!token || !sessionId) {
        client.emit('terminal:error', 'Missing token or sessionId');
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      const session = await this.prisma.agentSession.findFirst({
        where: { id: sessionId, userId: payload.sub },
        include: { workspace: true },
      });

      if (!session) {
        client.emit('terminal:error', 'Session not found');
        client.disconnect(true);
        return;
      }

      // The workspace path is meaningful only on the machine that created the
      // session. This gateway is a fallback for browser-only clients (the desktop
      // app runs its own local terminal via Electron's IPC — see
      // frontend/src/app/dashboard/sessions/[id]/components/session-terminal.tsx)
      // and only works if this backend process happens to share a filesystem
      // with that workspace (e.g. local development). On a remote deployment,
      // it correctly cannot see the user's local files.
      const cwd = session.workspace.pathOrRepoUrl;
      if (!existsSync(cwd)) {
        client.emit(
          'terminal:error',
          'This backend cannot access your local project files. Use the desktop app for a live terminal, or run the backend on the same machine as your project.',
        );
        client.disconnect(true);
        return;
      }

      let pty: typeof import('node-pty');
      try {
        pty = loadPty();
      } catch (err) {
        this.logger.error('node-pty is unavailable in this environment', err as Error);
        client.emit(
          'terminal:error',
          'Terminal sessions are unavailable in this environment (no native PTY support).',
        );
        client.disconnect(true);
        return;
      }

      const shell = pty.spawn(SHELL, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd,
        env: process.env as Record<string, string>,
      });

      this.ptyBySocket.set(client.id, shell);
      this.sessionBySocket.set(client.id, sessionId);
      if (!this.socketsBySession.has(sessionId)) {
        this.socketsBySession.set(sessionId, new Set());
      }
      this.socketsBySession.get(sessionId)!.add(client.id);

      shell.onData((data) => {
        client.emit('terminal:output', data);
      });

      shell.onExit(({ exitCode }) => {
        client.emit('terminal:exit', exitCode);
        client.disconnect(true);
      });

      this.logger.log(`Terminal started for session ${sessionId} (socket ${client.id})`);
    } catch (err) {
      this.logger.error('Failed to establish terminal connection', err as Error);
      client.emit('terminal:error', 'Unable to start terminal');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const shell = this.ptyBySocket.get(client.id);
    if (shell) {
      shell.kill();
      this.ptyBySocket.delete(client.id);
    }
    const sessionId = this.sessionBySocket.get(client.id);
    if (sessionId) {
      this.socketsBySession.get(sessionId)?.delete(client.id);
      this.sessionBySocket.delete(client.id);
    }
  }

  /** Kills any active shell(s) for this session and disconnects their sockets. */
  terminateSession(sessionId: string): void {
    const socketIds = this.socketsBySession.get(sessionId);
    if (!socketIds) return;

    for (const socketId of socketIds) {
      const shell = this.ptyBySocket.get(socketId);
      shell?.kill();
      this.ptyBySocket.delete(socketId);
      this.sessionBySocket.delete(socketId);
      this.server.of('/terminal').sockets.get(socketId)?.disconnect(true);
    }
    this.socketsBySession.delete(sessionId);
  }

  @SubscribeMessage('terminal:input')
  handleInput(@ConnectedSocket() client: Socket, @MessageBody() data: string): void {
    const shell = this.ptyBySocket.get(client.id);
    shell?.write(data);
  }

  @SubscribeMessage('terminal:resize')
  handleResize(
    @ConnectedSocket() client: Socket,
    @MessageBody() size: { cols: number; rows: number },
  ): void {
    const shell = this.ptyBySocket.get(client.id);
    if (shell && size?.cols && size?.rows) {
      shell.resize(size.cols, size.rows);
    }
  }
}
