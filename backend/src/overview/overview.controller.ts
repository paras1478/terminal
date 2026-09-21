import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { OverviewService } from './overview.service';
import { OverviewStatsResponseDto } from './dto/overview-stats-response.dto';
import { LiveSessionResponseDto } from './dto/live-session-response.dto';

@ApiTags('overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('overview')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get top-level dashboard stats with 30-day deltas' })
  @ApiResponse({ status: 200, type: OverviewStatsResponseDto })
  getStats(@CurrentUser() user: JwtPayload): Promise<OverviewStatsResponseDto> {
    return this.overviewService.getStats(user.sub);
  }

  @Get('live-session')
  @ApiOperation({
    summary:
      'Get the current live agent session for the "agent-session - live" panel',
  })
  @ApiResponse({ status: 200, type: LiveSessionResponseDto })
  getLiveSession(
    @CurrentUser() user: JwtPayload,
  ): Promise<LiveSessionResponseDto> {
    return this.overviewService.getLiveSession(user.sub);
  }
}
