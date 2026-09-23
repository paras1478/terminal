import { ApiProperty } from '@nestjs/swagger';
import type { AiProviderId } from '../../ai/model-catalog';

export class AvailableModelDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  provider!: AiProviderId;

  @ApiProperty()
  label!: string;

  @ApiProperty({ description: 'False if no API key is configured for this model\'s provider.' })
  available!: boolean;
}

export class SettingsResponseDto {
  @ApiProperty()
  confirmationRequired!: boolean;

  @ApiProperty({ type: [String] })
  allowedPatterns!: string[];

  @ApiProperty({ type: [String] })
  dangerousBlocklist!: string[];

  @ApiProperty()
  maxStepsPerTask!: number;

  @ApiProperty()
  maxRuntimeSeconds!: number;

  @ApiProperty()
  maxConcurrentSessions!: number;

  @ApiProperty()
  notifyOnCompletion!: boolean;

  @ApiProperty()
  notifyOnFailure!: boolean;

  @ApiProperty()
  notifyByEmail!: boolean;

  @ApiProperty()
  theme!: string;

  @ApiProperty()
  modelSelection!: string;

  @ApiProperty({ type: Object })
  apiKeys!: Record<string, unknown>;

  @ApiProperty({ type: [AvailableModelDto] })
  availableModels!: AvailableModelDto[];

  @ApiProperty()
  updatedAt!: Date;
}
