import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WriteFileDto {
  @ApiProperty()
  @IsString()
  content!: string;
}
