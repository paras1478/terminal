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
import * as pty from 'node-pty';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PrismaService } from '../prisma/prisma.service';

const SHELL = process.platform === 'win32' ? 'powershell.exe' : 'bash';

@WebSocketGateway({
  namespace: 'terminal',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true },
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

      const cwd = session.workspace.pathOrRepoUrl;
      if (!existsSync(cwd)) {
        client.emit('terminal:error', `Workspace path does not exist: ${cwd}`);
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
