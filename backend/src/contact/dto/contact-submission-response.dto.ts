import { ApiProperty } from '@nestjs/swagger';

export class ContactSubmissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: Date;
}
