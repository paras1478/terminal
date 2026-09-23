import { ApiProperty } from '@nestjs/swagger';

class SessionTimelineStepDto {
  @ApiProperty()
  order!: number;

  @ApiProperty()
  type!: string;

  @ApiProperty({ required: false })
  command?: string;

  @ApiProperty({ required: false })
  output?: string;

  @ApiProperty({ required: false })
  exitStatus?: number;

  @ApiProperty()
  createdAt!: Date;
}

export class SessionDetailResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty({
    description:
      "The workspace identifier from the client's own machine (see CreateSessionDto.path). " +
      'The backend never resolves this against a filesystem — only the local desktop app does.',
  })
  workspacePath!: string;

  @ApiProperty()
  goal!: string;

  @ApiProperty({ enum: ['RUNNING', 'COMPLETED', 'FAILED'] })
  status!: string;

  @ApiProperty()
  plan!: unknown;

  @ApiProperty({ type: [SessionTimelineStepDto] })
  timeline!: SessionTimelineStepDto[];

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty({ nullable: true })
  completedAt!: Date | null;

  @ApiProperty()
  commandsCount!: number;
}
