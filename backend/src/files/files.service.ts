import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync } from 'fs';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  isSecretLikePath,
  resolveWithinWorkspace,
} from '../agent/workspace-fs.util';
import { FileContentDto, FileNodeDto } from './dto/file-node.dto';

const IGNORED_DIR_NAMES = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo']);
const MAX_FILE_READ_BYTES = 1_000_000;

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolves the on-disk workspace root for a session owned by userId, or throws. */
  async resolveWorkspaceRoot(userId: string, sessionId: string): Promise<string> {
    const session = await this.prisma.agentSession.findFirst({
      where: { id: sessionId, userId },
      include: { workspace: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const root = session.workspace.pathOrRepoUrl;
    if (!existsSync(root)) {
      throw new NotFoundException(`Workspace path does not exist: ${root}`);
    }

    return root;
  }

  async getTree(userId: string, sessionId: string): Promise<FileNodeDto> {
    const root = await this.resolveWorkspaceRoot(userId, sessionId);
    return this.buildNode(root, root, '.');
  }

  private async buildNode(root: string, absPath: string, relPath: string): Promise<FileNodeDto> {
    const name = relPath === '.' ? relPath : relPath.split(/[\\/]/).pop()!;
    const stats = await stat(absPath);

    if (!stats.isDirectory()) {
      return { name, path: relPath, type: 'file', size: stats.size };
    }

    const entries = await readdir(absPath, { withFileTypes: true });
    const children: FileNodeDto[] = [];

    for (const entry of entries) {
      if (IGNORED_DIR_NAMES.has(entry.name)) continue;
      if (isSecretLikePath(entry.name)) continue;

      const childRel = relPath === '.' ? entry.name : `${relPath}/${entry.name}`;
      const childAbs = join(absPath, entry.name);

      try {
        if (entry.isDirectory()) {
          children.push(await this.buildNode(root, childAbs, childRel));
        } else if (entry.isFile()) {
          const childStat = await stat(childAbs);
          children.push({ name: entry.name, path: childRel, type: 'file', size: childStat.size });
        }
      } catch {
        // skip unreadable entries (permissions, broken symlinks, etc.)
      }
    }

    children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return { name, path: relPath, type: 'directory', children };
  }

  async readFile(userId: string, sessionId: string, relPath: string): Promise<FileContentDto> {
    const root = await this.resolveWorkspaceRoot(userId, sessionId);
    const absPath = resolveWithinWorkspace(root, relPath);

    if (isSecretLikePath(relPath)) {
      throw new ForbiddenException('Access to this file is not allowed');
    }

    const stats = await stat(absPath);
    if (!stats.isFile()) {
      throw new BadRequestException('Path is not a file');
    }

    const truncated = stats.size > MAX_FILE_READ_BYTES;
    const buffer = await readFile(absPath);
    const content = buffer.subarray(0, MAX_FILE_READ_BYTES).toString('utf-8');

    return { path: relPath, content, truncated };
  }

  async writeFile(
    userId: string,
    sessionId: string,
    relPath: string,
    content: string,
  ): Promise<{ path: string }> {
    const root = await this.resolveWorkspaceRoot(userId, sessionId);
    const absPath = resolveWithinWorkspace(root, relPath);

    if (isSecretLikePath(relPath)) {
      throw new ForbiddenException('Writing to this file is not allowed');
    }

    await writeFile(absPath, content, 'utf-8');
    return { path: relPath };
  }
}
