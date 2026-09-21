import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { relative, sep } from 'path';
import { Server, Socket } from 'socket.io';
import chokidar, { FSWatcher } from 'chokidar';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PrismaService } from '../prisma/prisma.service';
import { isSecretLikePath } from '../agent/workspace-fs.util';

const IGNORED_DIR_NAMES = ['node_modules', '.git', '.next', 'dist', 'build', '.turbo'];

export type FileChangeEvent = {
  type: 'add' | 'addDir' | 'unlink' | 'unlinkDir' | 'change';
  path: string;
};

@WebSocketGateway({
  namespace: 'files',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true },
})
export class FilesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(FilesGateway.name);
  private readonly watcherBySocket = new Map<string, FSWatcher>();

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
        client.emit('files:error', 'Missing token or sessionId');
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
        client.emit('files:error', 'Session not found');
        client.disconnect(true);
        return;
      }

      const root = session.workspace.pathOrRepoUrl;

      const watcher = chokidar.watch(root, {
        ignored: (path: string) => {
          const rel = relative(root, path);
          if (!rel || rel.startsWith('..')) return false;
          const segments = rel.split(sep);
          return segments.some(
            (segment) => IGNORED_DIR_NAMES.includes(segment) || isSecretLikePath(segment),
          );
        },
        ignoreInitial: true,
        persistent: true,
      });

      const emitChange = (type: FileChangeEvent['type'], absPath: string) => {
        const rel = relative(root, absPath).split(sep).join('/');
        client.emit('files:change', { type, path: rel } satisfies FileChangeEvent);
      };

      watcher
        .on('add', (path) => emitChange('add', path))
        .on('addDir', (path) => emitChange('addDir', path))
        .on('unlink', (path) => emitChange('unlink', path))
        .on('unlinkDir', (path) => emitChange('unlinkDir', path))
        .on('change', (path) => emitChange('change', path))
        .on('error', (err) => this.logger.error('Watcher error', err as Error));

      this.watcherBySocket.set(client.id, watcher);
      this.logger.log(`File watcher started for session ${sessionId} (socket ${client.id})`);
    } catch (err) {
      this.logger.error('Failed to establish file watch connection', err as Error);
      client.emit('files:error', 'Unable to watch workspace files');
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const watcher = this.watcherBySocket.get(client.id);
    if (watcher) {
      await watcher.close();
      this.watcherBySocket.delete(client.id);
    }
  }
}
