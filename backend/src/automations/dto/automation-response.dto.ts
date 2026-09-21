import { ApiProperty } from '@nestjs/swagger';

export class AutomationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  schedule!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty()
  nextRunAt!: Date;

  @ApiProperty({ nullable: true })
  lastRunAt!: Date | null;

  @ApiProperty({ enum: ['SUCCESS', 'FAILED', 'PENDING'] })
  lastRunStatus!: string;

  @ApiProperty()
  enabled!: boolean;

  @ApiProperty()
  taskGoal!: string;

  @ApiProperty()
  createdAt!: Date;
}
