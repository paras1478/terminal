import { ApiProperty } from '@nestjs/swagger';

export class WorkspaceResponseDto {
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
  createdAt!: Date;
}
