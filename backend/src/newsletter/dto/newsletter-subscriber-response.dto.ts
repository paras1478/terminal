import { ApiProperty } from '@nestjs/swagger';

export class NewsletterSubscriberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  subscribed!: boolean;
}
