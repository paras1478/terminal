import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { AutomationsService } from './automations.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { AutomationResponseDto } from './dto/automation-response.dto';

@ApiTags('automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  @ApiOperation({ summary: 'List scheduled automations' })
  @ApiResponse({ status: 200, type: [AutomationResponseDto] })
  list(@CurrentUser() user: JwtPayload): Promise<AutomationResponseDto[]> {
    return this.automationsService.list(user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new automation (agent task + schedule)' })
  @ApiResponse({ status: 201, type: AutomationResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAutomationDto,
  ): Promise<AutomationResponseDto> {
    return this.automationsService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Enable/disable or update an automation' })
  @ApiResponse({ status: 200, type: AutomationResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationDto,
  ): Promise<AutomationResponseDto> {
    return this.automationsService.update(user.sub, id, dto);
  }
}
