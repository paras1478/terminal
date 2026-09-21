import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OverviewStatsResponseDto } from './dto/overview-stats-response.dto';
import { LiveSessionResponseDto } from './dto/live-session-response.dto';

function pctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<OverviewStatsResponseDto> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalCurrent,
      totalPrevious,
      successCurrent,
      successPrevious,
      failedCurrent,
      failedPrevious,
      activeSessions,
      activeSessionsPrevious,
    ] = await Promise.all([
      this.prisma.commandLog.count({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.commandLog.count({
        where: { userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      this.prisma.commandLog.count({
        where: { userId, exitStatus: 0, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.commandLog.count({
        where: {
          userId,
          exitStatus: 0,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      this.prisma.commandLog.count({
        where: {
          userId,
          exitStatus: { not: 0 },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.commandLog.count({
        where: {
          userId,
          exitStatus: { not: 0 },
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      this.prisma.agentSession.count({ where: { userId, status: 'RUNNING' } }),
      this.prisma.agentSession.count({
        where: {
          userId,
          status: 'RUNNING',
          startedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      totalCommands: {
        value: totalCurrent,
        changePct: pctChange(totalCurrent, totalPrevious),
      },
      successfulCommands: {
        value: successCurrent,
        changePct: pctChange(successCurrent, successPrevious),
      },
      failedCommands: {
        value: failedCurrent,
        changePct: pctChange(failedCurrent, failedPrevious),
      },
      activeSessions: {
        value: activeSessions,
        changePct: pctChange(activeSessions, activeSessionsPrevious),
      },
      uptimePct: 99.98,
    };
  }

  async getLiveSession(userId: string): Promise<LiveSessionResponseDto> {
    const session = await this.prisma.agentSession.findFirst({
      where: { userId, status: 'RUNNING' },
      orderBy: { lastActivityAt: 'desc' },
      include: { workspace: true, steps: { orderBy: { order: 'asc' } } },
    });

    if (!session) {
      throw new NotFoundException('No active agent session found');
    }

    return {
      id: session.id,
      workspaceId: session.workspaceId,
      workspaceName: session.workspace.name,
      goal: session.goal,
      status: session.status,
      plan: session.plan as unknown as LiveSessionResponseDto['plan'],
      steps: session.steps.map((step) => ({
        order: step.order,
        type: step.type,
        command: step.command ?? undefined,
        output: step.output ?? undefined,
        exitStatus: step.exitStatus ?? undefined,
        createdAt: step.createdAt,
      })),
      startedAt: session.startedAt,
      commandsCount: session.commandsCount,
    };
  }
}
