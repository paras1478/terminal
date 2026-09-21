import { ApiProperty } from '@nestjs/swagger';

class WorkspaceIntegrationSummaryDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['CONNECTED', 'NOT_CONNECTED'] })
  status!: string;
}

class RecentSessionSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  goal!: string;

  @ApiProperty({ enum: ['RUNNING', 'COMPLETED', 'FAILED'] })
  status!: string;

  @ApiProperty()
  startedAt!: Date;
}

class RecentTaskSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'] })
  status!: string;
}

export class WorkspaceDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  pathOrRepoUrl!: string;

  @ApiProperty()
  languageStack!: string;

  @ApiProperty()
  recentActivity!: string;

  @ApiProperty()
  sessionsCount!: number;

  @ApiProperty()
  tasksCount!: number;

  @ApiProperty()
  logsCount!: number;

  @ApiProperty({ type: [WorkspaceIntegrationSummaryDto] })
  integrations!: WorkspaceIntegrationSummaryDto[];

  @ApiProperty({ type: [RecentSessionSummaryDto] })
  recentSessions!: RecentSessionSummaryDto[];

  @ApiProperty({ type: [RecentTaskSummaryDto] })
  recentTasks!: RecentTaskSummaryDto[];

  @ApiProperty()
  createdAt!: Date;
}
