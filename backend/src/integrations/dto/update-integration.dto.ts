import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class UpdateIntegrationDto {
  @ApiPropertyOptional({ example: { scope: 'repo,workflow' } })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
