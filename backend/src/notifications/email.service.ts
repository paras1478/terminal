import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('SMTP_HOST') &&
        this.config.get<string>('SMTP_USER') &&
        this.config.get<string>('SMTP_PASS'),
    );
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST'),
        port: this.config.get<number>('SMTP_PORT') ?? 587,
        secure: this.config.get<number>('SMTP_PORT') === 465,
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
    return this.transporter;
  }

  async send(to: string, subject: string, text: string): Promise<{ sent: boolean; error?: string }> {
    if (!this.isConfigured()) {
      this.logger.warn(`Email not sent (SMTP not configured): "${subject}" to ${to}`);
      return { sent: false, error: 'SMTP is not configured on this server.' };
    }

    try {
      await this.getTransporter().sendMail({
        from: this.config.get<string>('SMTP_FROM') ?? this.config.get<string>('SMTP_USER'),
        to,
        subject,
        text,
      });
      return { sent: true };
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err as Error);
      return { sent: false, error: (err as Error).message };
    }
  }
}
