import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { LogsService } from './logs.service';
import { ListLogsQueryDto } from './dto/list-logs-query.dto';
import {
  PaginatedLogsResponseDto,
  LogDetailResponseDto,
} from './dto/log-response.dto';

@ApiTags('logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'List command/output logs with filters' })
  @ApiResponse({ status: 200, type: PaginatedLogsResponseDto })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListLogsQueryDto,
  ): Promise<PaginatedLogsResponseDto> {
    return this.logsService.list(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full output for a specific log entry' })
  @ApiResponse({ status: 200, type: LogDetailResponseDto })
  getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<LogDetailResponseDto> {
    return this.logsService.getDetail(user.sub, id);
  }
}
