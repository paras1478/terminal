import { ApiProperty } from '@nestjs/swagger';

export class DemoRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: Date;
}
