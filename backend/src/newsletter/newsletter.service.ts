import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { NewsletterSubscriberResponseDto } from './dto/newsletter-subscriber-response.dto';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(
    dto: SubscribeNewsletterDto,
  ): Promise<NewsletterSubscriberResponseDto> {
    const subscriber = await this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email },
      create: { email: dto.email },
      update: { subscribed: true, unsubscribedAt: null },
    });

    return {
      id: subscriber.id,
      email: subscriber.email,
      subscribed: subscriber.subscribed,
    };
  }

  async unsubscribe(email: string): Promise<NewsletterSubscriberResponseDto> {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });
    if (!subscriber) {
      throw new NotFoundException('No subscription found for this email');
    }

    const updated = await this.prisma.newsletterSubscriber.update({
      where: { email },
      data: { subscribed: false, unsubscribedAt: new Date() },
    });

    return {
      id: updated.id,
      email: updated.email,
      subscribed: updated.subscribed,
    };
  }
}
