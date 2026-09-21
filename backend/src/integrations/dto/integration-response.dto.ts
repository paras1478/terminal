import { ApiProperty } from '@nestjs/swagger';

export class IntegrationResponseDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: ['CONNECTED', 'NOT_CONNECTED'] })
  status!: string;

  @ApiProperty({ nullable: true })
  connectedAt!: Date | null;

  @ApiProperty({ type: Object, nullable: true })
  config!: Record<string, unknown> | null;
}
