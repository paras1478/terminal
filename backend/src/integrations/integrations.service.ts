import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationResponseDto } from './dto/integration-response.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

function toDto(integration: {
  key: string;
  name: string;
  description: string;
  status: string;
  connectedAt: Date | null;
  config: Prisma.JsonValue | null;
}): IntegrationResponseDto {
  return {
    key: integration.key,
    name: integration.name,
    description: integration.description,
    status: integration.status,
    connectedAt: integration.connectedAt,
    config: (integration.config as Record<string, unknown> | null) ?? {},
  };
}

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<IntegrationResponseDto[]> {
    const integrations = await this.prisma.workspaceIntegration.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return integrations.map(toDto);
  }

  async connect(
    userId: string,
    key: string,
    dto: UpdateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    const existing = await this.prisma.workspaceIntegration.findFirst({
      where: { userId, key },
    });
    if (!existing) {
      throw new NotFoundException('Integration not found');
    }

    const updated = await this.prisma.workspaceIntegration.update({
      where: { id: existing.id },
      data: {
        status: 'CONNECTED',
        connectedAt: new Date(),
        config: (dto.config ?? existing.config ?? {}) as Prisma.InputJsonValue,
      },
    });

    return toDto(updated);
  }

  async disconnect(
    userId: string,
    key: string,
  ): Promise<IntegrationResponseDto> {
    const existing = await this.prisma.workspaceIntegration.findFirst({
      where: { userId, key },
    });
    if (!existing) {
      throw new NotFoundException('Integration not found');
    }

    const updated = await this.prisma.workspaceIntegration.update({
      where: { id: existing.id },
      data: { status: 'NOT_CONNECTED', connectedAt: null },
    });

    return toDto(updated);
  }
}
