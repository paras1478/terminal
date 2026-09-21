import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty()
  updatedAt!: Date;
}
