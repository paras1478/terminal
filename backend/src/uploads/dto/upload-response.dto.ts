import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: '3f1c1e2a-...-report.pdf' })
  key!: string;

  @ApiProperty({
    example: 'https://assets.example.com/3f1c1e2a-...-report.pdf',
    nullable: true,
  })
  url!: string | null;
}
