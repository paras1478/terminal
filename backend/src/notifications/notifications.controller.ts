import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';
import { NotificationResponseDto, NotificationsListResponseDto } from './dto/notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's notifications, most recent first" })
  @ApiResponse({ status: 200, type: NotificationsListResponseDto })
  async list(@CurrentUser() user: JwtPayload): Promise<NotificationsListResponseDto> {
    const [items, unreadCount] = await Promise.all([
      this.notifications.list(user.sub),
      this.notifications.unreadCount(user.sub),
    ]);
    return { items, unreadCount };
  }

  @Patch('read-all')
  @ApiOperation({ summary: "Mark all of the current user's notifications as read" })
  @ApiResponse({ status: 200, description: '{ count: number }' })
  markAllRead(@CurrentUser() user: JwtPayload): Promise<{ count: number }> {
    return this.notifications.markAllRead(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<NotificationResponseDto> {
    return this.notifications.markRead(user.sub, id);
  }
}
