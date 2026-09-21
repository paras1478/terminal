import { ApiProperty } from '@nestjs/swagger';

class PlanStepDto {
  @ApiProperty()
  order!: number;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  done!: boolean;
}

class SessionStepDto {
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

export class LiveSessionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty()
  goal!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [PlanStepDto] })
  plan!: PlanStepDto[];

  @ApiProperty({ type: [SessionStepDto] })
  steps!: SessionStepDto[];

  @ApiProperty()
  startedAt!: Date;

  @ApiProperty()
  commandsCount!: number;
}
