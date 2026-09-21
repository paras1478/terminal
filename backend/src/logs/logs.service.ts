import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListLogsQueryDto } from './dto/list-logs-query.dto';
import {
  PaginatedLogsResponseDto,
  LogDetailResponseDto,
} from './dto/log-response.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListLogsQueryDto,
  ): Promise<PaginatedLogsResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.CommandLogWhereInput = {
      userId,
      ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
      ...(query.status === 'success' ? { exitStatus: 0 } : {}),
      ...(query.status === 'failed' ? { exitStatus: { not: 0 } } : {}),
      ...(query.q
        ? { command: { contains: query.q, mode: 'insensitive' } }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.commandLog.findMany({
        where,
        include: { workspace: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.commandLog.count({ where }),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        timestamp: log.createdAt,
        sessionId: log.sessionId,
        workspaceId: log.workspaceId,
        workspaceName: log.workspace.name,
        command: log.command,
        exitStatus: log.exitStatus,
        outputPreview: log.outputPreview,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getDetail(userId: string, id: string): Promise<LogDetailResponseDto> {
    const log = await this.prisma.commandLog.findFirst({
      where: { id, userId },
      include: { workspace: true },
    });

    if (!log) {
      throw new NotFoundException('Log entry not found');
    }

    return {
      id: log.id,
      timestamp: log.createdAt,
      sessionId: log.sessionId,
      workspaceId: log.workspaceId,
      workspaceName: log.workspace.name,
      command: log.command,
      exitStatus: log.exitStatus,
      outputPreview: log.outputPreview,
      fullOutput: log.fullOutput,
    };
  }
}
