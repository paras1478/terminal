import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackEventDto {
  @ApiProperty({ example: 'cta_clicked' })
  @IsString()
  @MaxLength(100)
  eventName!: string;

  @ApiProperty({ example: { button: 'get_started' }, required: false })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiProperty({ example: 'a1b2c3', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  sessionId?: string;

  @ApiProperty({ example: '/landing', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  path?: string;

  @ApiProperty({ example: 'https://google.com', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;
}
