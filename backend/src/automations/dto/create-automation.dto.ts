import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAutomationDto {
  @ApiProperty({ example: 'Nightly dependency audit' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    example:
      'Run npm audit and open an issue if new vulnerabilities are found.',
  })
  @IsString()
  @MaxLength(1000)
  description!: string;

  @ApiProperty({
    example: 'Audit dependencies for vulnerabilities and summarize findings',
  })
  @IsString()
  @MaxLength(500)
  taskGoal!: string;

  @ApiProperty()
  @IsMongoId()
  workspaceId!: string;

  @ApiProperty({
    example: '0 2 * * *',
    description: 'Cron expression or interval string',
  })
  @IsString()
  @MaxLength(100)
  schedule!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
