import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsOptional } from 'class-validator';

export class ListTasksQueryDto {
  @ApiPropertyOptional({ enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'] })
  @IsOptional()
  @IsIn(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'])
  status?: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  workspaceId?: string;
}
