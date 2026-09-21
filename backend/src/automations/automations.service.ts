import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { AutomationResponseDto } from './dto/automation-response.dto';

function toDto(
  automation: {
    id: string;
    name: string;
    description: string;
    schedule: string;
    workspaceId: string;
    nextRunAt: Date;
    lastRunAt: Date | null;
    lastRunStatus: string;
    enabled: boolean;
    taskGoal: string;
    createdAt: Date;
  },
  workspaceName: string,
): AutomationResponseDto {
  return {
    id: automation.id,
    name: automation.name,
    description: automation.description,
    schedule: automation.schedule,
    workspaceId: automation.workspaceId,
    workspaceName,
    nextRunAt: automation.nextRunAt,
    lastRunAt: automation.lastRunAt,
    lastRunStatus: automation.lastRunStatus,
    enabled: automation.enabled,
    taskGoal: automation.taskGoal,
    createdAt: automation.createdAt,
  };
}

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<AutomationResponseDto[]> {
    const automations = await this.prisma.automation.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { nextRunAt: 'asc' },
    });

    return automations.map((a) => toDto(a, a.workspace.name));
  }

  async create(
    userId: string,
    dto: CreateAutomationDto,
  ): Promise<AutomationResponseDto> {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id: dto.workspaceId, userId },
    });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const automation = await this.prisma.automation.create({
      data: {
        userId,
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description,
        taskGoal: dto.taskGoal,
        schedule: dto.schedule,
        enabled: dto.enabled ?? true,
        nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
        lastRunStatus: 'PENDING',
      },
    });

    return toDto(automation, workspace.name);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateAutomationDto,
  ): Promise<AutomationResponseDto> {
    const existing = await this.prisma.automation.findFirst({
      where: { id, userId },
      include: { workspace: true },
    });
    if (!existing) {
      throw new NotFoundException('Automation not found');
    }

    const updated = await this.prisma.automation.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.schedule !== undefined ? { schedule: dto.schedule } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      },
    });

    return toDto(updated, existing.workspace.name);
  }
}
