import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NewsletterService } from './newsletter.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { UnsubscribeNewsletterDto } from './dto/unsubscribe-newsletter.dto';
import { NewsletterSubscriberResponseDto } from './dto/newsletter-subscriber-response.dto';

@ApiTags('newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Subscribe an email to the newsletter' })
  @ApiResponse({ status: 201, type: NewsletterSubscriberResponseDto })
  subscribe(
    @Body() dto: SubscribeNewsletterDto,
  ): Promise<NewsletterSubscriberResponseDto> {
    return this.newsletterService.subscribe(dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Unsubscribe an email from the newsletter' })
  @ApiResponse({ status: 200, type: NewsletterSubscriberResponseDto })
  unsubscribe(
    @Body() dto: UnsubscribeNewsletterDto,
  ): Promise<NewsletterSubscriberResponseDto> {
    return this.newsletterService.unsubscribe(dto.email);
  }
}
