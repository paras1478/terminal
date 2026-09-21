import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistEntryResponseDto } from './dto/waitlist-entry-response.dto';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Join the product waitlist' })
  @ApiResponse({ status: 201, type: WaitlistEntryResponseDto })
  create(
    @Body() dto: CreateWaitlistEntryDto,
  ): Promise<WaitlistEntryResponseDto> {
    return this.waitlistService.create(dto);
  }
}
