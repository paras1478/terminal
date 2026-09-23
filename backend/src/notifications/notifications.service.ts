import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

export type SessionOutcome = 'completed' | 'failed';

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

      if (settings.notifyByEmail) {
        const subject = outcome === 'completed' ? 'Task completed' : 'Task failed';
        const result = await this.email.send(
          user.email,
          `${subject} — session ${sessionId}`,
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
}
