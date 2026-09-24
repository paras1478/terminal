import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ExchangeOAuthCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;
}
