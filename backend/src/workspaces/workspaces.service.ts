import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceDetailResponseDto } from './dto/workspace-detail-response.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<WorkspaceResponseDto[]> {
    const workspaces = await this.prisma.workspace.findMany({
      where: { userId },
      include: { _count: { select: { sessions: true, tasks: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      pathOrRepoUrl: w.pathOrRepoUrl,
      languageStack: w.languageStack,
      recentActivity: w.recentActivity,
      sessionsCount: w._count.sessions,
      tasksCount: w._count.tasks,
      createdAt: w.createdAt,
    }));
  }

  async clearAllData(userId: string): Promise<{ cleared: boolean }> {
    await this.prisma.sessionStep.deleteMany({ where: { session: { userId } } });
    await this.prisma.commandLog.deleteMany({ where: { userId } });
    await this.prisma.agentSession.deleteMany({ where: { userId } });
    await this.prisma.task.deleteMany({ where: { userId } });
    await this.prisma.automation.deleteMany({ where: { userId } });
    await this.prisma.workspaceIntegration.deleteMany({ where: { userId } });
    await this.prisma.userSettings.deleteMany({ where: { userId } });
    await this.prisma.workspace.deleteMany({ where: { userId } });
    return { cleared: true };
  }

  async getDetail(
    userId: string,
    id: string,
  ): Promise<WorkspaceDetailResponseDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { sessions: true, tasks: true, logs: true } },
        integrations: true,
        sessions: { orderBy: { startedAt: 'desc' }, take: 5 },
        tasks: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      pathOrRepoUrl: workspace.pathOrRepoUrl,
      languageStack: workspace.languageStack,
      recentActivity: workspace.recentActivity,
      sessionsCount: workspace._count.sessions,
      tasksCount: workspace._count.tasks,
      logsCount: workspace._count.logs,
      integrations: workspace.integrations.map((i) => ({
        key: i.key,
        name: i.name,
        status: i.status,
      })),
      recentSessions: workspace.sessions.map((s) => ({
        id: s.id,
        goal: s.goal,
        status: s.status,
        startedAt: s.startedAt,
      })),
      recentTasks: workspace.tasks.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
      })),
      createdAt: workspace.createdAt,
    };
  }
}
