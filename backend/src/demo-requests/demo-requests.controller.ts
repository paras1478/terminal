import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DemoRequestsService } from './demo-requests.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { DemoRequestResponseDto } from './dto/demo-request-response.dto';

@ApiTags('demo-requests')
@Controller('demo-requests')
export class DemoRequestsController {
  constructor(private readonly demoRequestsService: DemoRequestsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Request a product demo' })
  @ApiResponse({ status: 201, type: DemoRequestResponseDto })
  create(@Body() dto: CreateDemoRequestDto): Promise<DemoRequestResponseDto> {
    return this.demoRequestsService.create(dto);
  }
}
