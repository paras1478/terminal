import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import { TrackEventDto } from './dto/track-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Record a user interaction event' })
  @ApiResponse({ status: 202, description: 'Event accepted' })
  track(@Body() dto: TrackEventDto): Promise<{ accepted: true }> {
    return this.eventsService.track(dto);
  }
}
