import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Fix flaky auth test' })
  @IsString()
  @MaxLength(200)
  goal!: string;

  @ApiProperty({
    example:
      'Investigate and fix the intermittent JWT expiry failure in auth.test.ts',
  })
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty()
  @IsMongoId()
  workspaceId!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], required: false })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiProperty({ required: false, example: '2026-08-10T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  schedule?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: ['bug-fix', 'auth'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  tags?: string[];
}
