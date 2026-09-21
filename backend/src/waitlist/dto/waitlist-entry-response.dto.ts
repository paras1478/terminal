import { ApiProperty } from '@nestjs/swagger';

export class WaitlistEntryResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  createdAt!: Date;
}
