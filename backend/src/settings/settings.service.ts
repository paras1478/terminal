import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponseDto } from './dto/settings-response.dto';

function maskApiKeys(apiKeys: Prisma.JsonValue | null): Record<string, string> {
  const raw = (apiKeys as Record<string, string> | null) ?? {};
  const masked: Record<string, string> = {};
  for (const [provider, value] of Object.entries(raw)) {
    if (typeof value !== 'string' || value.length === 0) {
      continue;
    }
    masked[provider] = value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
  }
  return masked;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateRaw(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async get(userId: string): Promise<SettingsResponseDto> {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return {
      confirmationRequired: settings.confirmationRequired,
      allowedPatterns: settings.allowedPatterns,
      dangerousBlocklist: settings.dangerousBlocklist,
      maxStepsPerTask: settings.maxStepsPerTask,
      maxRuntimeSeconds: settings.maxRuntimeSeconds,
      maxConcurrentSessions: settings.maxConcurrentSessions,
      notifyOnCompletion: settings.notifyOnCompletion,
      notifyOnFailure: settings.notifyOnFailure,
      notifyByEmail: settings.notifyByEmail,
      theme: settings.theme,
      modelSelection: settings.modelSelection,
      apiKeys: maskApiKeys(settings.apiKeys),
      updatedAt: settings.updatedAt,
    };
  }

  async update(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    const existing = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const mergedApiKeys = dto.apiKeys
      ? { ...(existing.apiKeys as Record<string, string>), ...dto.apiKeys }
      : undefined;

    const updated = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        ...(dto.confirmationRequired !== undefined
          ? { confirmationRequired: dto.confirmationRequired }
          : {}),
        ...(dto.allowedPatterns !== undefined
          ? { allowedPatterns: dto.allowedPatterns }
          : {}),
        ...(dto.dangerousBlocklist !== undefined
          ? { dangerousBlocklist: dto.dangerousBlocklist }
          : {}),
        ...(dto.maxStepsPerTask !== undefined
          ? { maxStepsPerTask: dto.maxStepsPerTask }
          : {}),
        ...(dto.maxRuntimeSeconds !== undefined
          ? { maxRuntimeSeconds: dto.maxRuntimeSeconds }
          : {}),
        ...(dto.maxConcurrentSessions !== undefined
          ? { maxConcurrentSessions: dto.maxConcurrentSessions }
          : {}),
        ...(dto.notifyOnCompletion !== undefined
          ? { notifyOnCompletion: dto.notifyOnCompletion }
          : {}),
        ...(dto.notifyOnFailure !== undefined
          ? { notifyOnFailure: dto.notifyOnFailure }
          : {}),
        ...(dto.notifyByEmail !== undefined
          ? { notifyByEmail: dto.notifyByEmail }
          : {}),
        ...(dto.theme !== undefined ? { theme: dto.theme } : {}),
        ...(dto.modelSelection !== undefined
          ? { modelSelection: dto.modelSelection }
          : {}),
        ...(mergedApiKeys !== undefined ? { apiKeys: mergedApiKeys } : {}),
      },
    });

    return {
      confirmationRequired: updated.confirmationRequired,
      allowedPatterns: updated.allowedPatterns,
      dangerousBlocklist: updated.dangerousBlocklist,
      maxStepsPerTask: updated.maxStepsPerTask,
      maxRuntimeSeconds: updated.maxRuntimeSeconds,
      maxConcurrentSessions: updated.maxConcurrentSessions,
      notifyOnCompletion: updated.notifyOnCompletion,
      notifyOnFailure: updated.notifyOnFailure,
      notifyByEmail: updated.notifyByEmail,
      theme: updated.theme,
      modelSelection: updated.modelSelection,
      apiKeys: maskApiKeys(updated.apiKeys),
      updatedAt: updated.updatedAt,
    };
  }
}
