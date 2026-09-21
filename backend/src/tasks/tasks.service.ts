import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TaskResponseDto } from './dto/task-response.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    query: ListTasksQueryDto,
  ): Promise<TaskResponseDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.workspaceId ? { workspaceId: query.workspaceId } : {}),
      },
      include: { workspace: true },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      workspaceId: task.workspaceId,
      workspaceName: task.workspace.name,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      scheduledAt: task.scheduledAt,
      createdAt: task.createdAt,
    }));
  }

  async create(userId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: dto.workspaceId, userId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const task = await this.prisma.task.create({
      data: {
        userId,
        workspaceId: dto.workspaceId,
        name: dto.goal,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        tags: dto.tags ?? [],
        scheduledAt: dto.schedule ? new Date(dto.schedule) : undefined,
        status: 'QUEUED',
      },
    });

    return {
      id: task.id,
      name: task.name,
      description: task.description,
      workspaceId: task.workspaceId,
      workspaceName: workspace.name,
      status: task.status,
      priority: task.priority,
      tags: task.tags,
      scheduledAt: task.scheduledAt,
      createdAt: task.createdAt,
    };
  }
}
