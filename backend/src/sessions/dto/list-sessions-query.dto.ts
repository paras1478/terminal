import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

export class ListSessionsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({ enum: ['RUNNING', 'COMPLETED', 'FAILED'] })
  @IsOptional()
  @IsIn(['RUNNING', 'COMPLETED', 'FAILED'])
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  workspaceId?: string;
}
