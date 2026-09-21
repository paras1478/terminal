import { ApiProperty } from '@nestjs/swagger';

export class HomepageContentResponseDto {
  @ApiProperty()
  section!: string;

  @ApiProperty()
  content!: Record<string, unknown>;

  @ApiProperty()
  updatedAt!: Date;
}
