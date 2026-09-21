import { ApiProperty } from '@nestjs/swagger';

export class SessionSummaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty()
  goal!: string;

  @ApiProperty({ enum: ['RUNNING', 'COMPLETED', 'FAILED'] })
  status!: string;

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty({
    description: 'Duration in seconds; null if still running',
    nullable: true,
  })
  durationSeconds!: number | null;

  @ApiProperty()
  commandsCount!: number;

  @ApiProperty()
  lastActivityAt!: Date;
}

export class PaginatedSessionsResponseDto {
  @ApiProperty({ type: [SessionSummaryResponseDto] })
  items!: SessionSummaryResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
