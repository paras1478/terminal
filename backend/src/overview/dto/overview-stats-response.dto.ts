import { ApiProperty } from '@nestjs/swagger';

class StatWithDelta {
  @ApiProperty()
  value!: number;

  @ApiProperty({ description: 'Percentage change vs the previous 30 days' })
  changePct!: number;
}

export class OverviewStatsResponseDto {
  @ApiProperty({ type: StatWithDelta })
  totalCommands!: StatWithDelta;

  @ApiProperty({ type: StatWithDelta })
  successfulCommands!: StatWithDelta;

  @ApiProperty({ type: StatWithDelta })
  failedCommands!: StatWithDelta;

  @ApiProperty({ type: StatWithDelta })
  activeSessions!: StatWithDelta;

  @ApiProperty({ description: 'Uptime percentage over the last 30 days' })
  uptimePct!: number;
}
