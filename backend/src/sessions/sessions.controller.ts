import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { SessionsService } from './sessions.service';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto';
import { PaginatedSessionsResponseDto } from './dto/session-summary-response.dto';
import { SessionDetailResponseDto } from './dto/session-detail-response.dto';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List running and past agent sessions (paginated)' })
  @ApiResponse({ status: 200, type: PaginatedSessionsResponseDto })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListSessionsQueryDto,
  ): Promise<PaginatedSessionsResponseDto> {
    return this.sessionsService.list(user.sub, query);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new agent session for a project path' })
  @ApiResponse({ status: 201, type: SessionDetailResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionDetailResponseDto> {
    return this.sessionsService.create(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full command/output timeline for a session' })
  @ApiResponse({ status: 200, type: SessionDetailResponseDto })
  getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<SessionDetailResponseDto> {
    return this.sessionsService.getDetail(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary:
      'Delete a session, terminating any active terminal/agent process first. Does not delete the project folder.',
  })
  @ApiResponse({ status: 204 })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.sessionsService.remove(user.sub, id);
  }
}
