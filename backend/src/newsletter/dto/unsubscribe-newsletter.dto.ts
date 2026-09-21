import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UnsubscribeNewsletterDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email!: string;
}
