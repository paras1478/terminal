import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, statSync } from 'fs';
import { isAbsolute } from 'path';
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
    const normalizedPath = dto.path.trim().replace(/[\\/]+$/, '');

    if (!isAbsolute(normalizedPath)) {
      throw new BadRequestException('Project location must be an absolute path');
    }

    if (!existsSync(normalizedPath) || !statSync(normalizedPath).isDirectory()) {
      throw new BadRequestException(
        `Project folder does not exist on this machine: ${normalizedPath}`,
      );
    }

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
