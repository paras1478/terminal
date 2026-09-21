import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Absolute path to the project on the machine running the agent',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  path!: string;

  @ApiPropertyOptional({
    description: 'Workspace display name; defaults to the last path segment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  goal!: string;

  @ApiPropertyOptional({ enum: ['FRONTEND', 'BACKEND', 'FULL_STACK'] })
  @IsOptional()
  @IsIn(['FRONTEND', 'BACKEND', 'FULL_STACK'])
  agentType?: 'FRONTEND' | 'BACKEND' | 'FULL_STACK';
}
