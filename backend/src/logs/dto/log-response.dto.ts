import { ApiProperty } from '@nestjs/swagger';

export class LogSummaryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  timestamp!: Date;

  @ApiProperty({ nullable: true })
  sessionId!: string | null;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty()
  command!: string;

  @ApiProperty()
  exitStatus!: number;

  @ApiProperty()
  outputPreview!: string;
}

export class PaginatedLogsResponseDto {
  @ApiProperty({ type: [LogSummaryResponseDto] })
  items!: LogSummaryResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}

export class LogDetailResponseDto extends LogSummaryResponseDto {
  @ApiProperty()
  fullOutput!: string;
}
