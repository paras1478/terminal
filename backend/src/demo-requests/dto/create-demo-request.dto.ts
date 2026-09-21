import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDemoRequestDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  company?: string;

  @ApiProperty({ example: '11-50', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  teamSize?: string;

  @ApiProperty({ example: '2026-08-15T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @ApiProperty({
    example: 'Interested in the enterprise plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
