import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

export type SessionOutcome = 'completed' | 'failed';

const OUTCOME_TO_TYPE: Record<SessionOutcome, NotificationType> = {
  completed: 'SESSION_COMPLETED',
  failed: 'SESSION_FAILED',
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /**
   * Called by AgentService whenever a run reaches a terminal state. Reads the
   * user's own notification preferences (UserSettings) and only acts on
   * outcomes/channels the user has actually enabled. Never throws: a
   * notification failure must not take down the agent run that triggered it.
   */
  async notifySessionOutcome(
    userId: string,
    sessionId: string,
    outcome: SessionOutcome,
    detail: string,
  ): Promise<void> {
    try {
      const [settings, user] = await Promise.all([
        this.prisma.userSettings.findUnique({ where: { userId } }),
        this.prisma.user.findUnique({ where: { id: userId } }),
      ]);
      if (!settings || !user) return;

      const shouldNotify =
        outcome === 'completed' ? settings.notifyOnCompletion : settings.notifyOnFailure;
      if (!shouldNotify) return;

      this.logger.log(`Session ${sessionId} ${outcome} — dispatching notification to user ${userId}`);

      const title = outcome === 'completed' ? 'Task completed' : 'Task failed';
      await this.prisma.notification.create({
        data: {
          userId,
          type: OUTCOME_TO_TYPE[outcome],
          title,
          message: detail,
          sessionId,
        },
      });

      if (settings.notifyByEmail) {
        const result = await this.email.send(
          user.email,
          `${title} — session ${sessionId}`,
          detail,
        );
        if (!result.sent) {
          this.logger.warn(`Email notification for session ${sessionId} was not sent: ${result.error}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to dispatch notification for session ${sessionId}`, err as Error);
    }
  }

  async list(userId: string, limit = 50): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}
