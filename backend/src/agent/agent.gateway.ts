import { Logger } from '@nestjs/common';
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
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PrismaService } from '../prisma/prisma.service';
import { AgentService } from './agent.service';

@WebSocketGateway({
  namespace: 'agent',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true },
})
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AgentGateway.name);
  private readonly userBySocket = new Map<string, JwtPayload>();
  private readonly sessionBySocket = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly agentService: AgentService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      const sessionId = client.handshake.query?.sessionId as string | undefined;

      if (!token || !sessionId) {
        client.emit('agent:error', 'Missing token or sessionId');
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      const session = await this.prisma.agentSession.findFirst({
        where: { id: sessionId, userId: payload.sub },
      });
      if (!session) {
        client.emit('agent:error', 'Session not found');
        client.disconnect(true);
        return;
      }

      this.userBySocket.set(client.id, payload);
      this.sessionBySocket.set(client.id, sessionId);
    } catch (err) {
      this.logger.error('Failed to authenticate agent socket', err as Error);
      client.emit('agent:error', 'Unauthorized');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.userBySocket.delete(client.id);
    this.sessionBySocket.delete(client.id);
  }

  @SubscribeMessage('agent:run')
  async handleRun(@ConnectedSocket() client: Socket, @MessageBody() goal: string): Promise<void> {
    const user = this.userBySocket.get(client.id);
    const sessionId = this.sessionBySocket.get(client.id);
    if (!user || !sessionId) return;

    if (this.agentService.isRunning(sessionId)) {
      client.emit('agent:error', 'Agent is already running for this session.');
      return;
    }

    await this.agentService.runGoal(user.sub, sessionId, goal, (event) => {
      client.emit('agent:activity', event);
    });
  }

  @SubscribeMessage('agent:stop')
  handleStop(@ConnectedSocket() client: Socket): void {
    const sessionId = this.sessionBySocket.get(client.id);
    if (sessionId) {
      this.agentService.stop(sessionId);
      client.emit('agent:stopped');
    }
  }

  @SubscribeMessage('agent:confirm')
  handleConfirm(
    @ConnectedSocket() _client: Socket,
    @MessageBody() data: { confirmationId: string; approved: boolean },
  ): void {
    this.agentService.resolveConfirmation(data.confirmationId, data.approved);
  }

  /** Stops any running agent loop for this session and disconnects its sockets. */
  terminateSession(sessionId: string): void {
    this.agentService.stop(sessionId);

    for (const [socketId, boundSessionId] of this.sessionBySocket.entries()) {
      if (boundSessionId === sessionId) {
        this.server.of('/agent').sockets.get(socketId)?.disconnect(true);
        this.sessionBySocket.delete(socketId);
        this.userBySocket.delete(socketId);
      }
    }
  }
}
