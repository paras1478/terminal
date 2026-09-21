import { ApiProperty } from '@nestjs/swagger';

export class FileNodeDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Path relative to the workspace root' })
  path!: string;

  @ApiProperty({ enum: ['file', 'directory'] })
  type!: 'file' | 'directory';

  @ApiProperty({ required: false })
  size?: number;

  @ApiProperty({ type: [FileNodeDto], required: false })
  children?: FileNodeDto[];
}

export class FileContentDto {
  @ApiProperty()
  path!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  truncated!: boolean;
}
