import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { IntegrationsService } from './integrations.service';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationResponseDto } from './dto/integration-response.dto';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List available integrations and their connection status',
  })
  @ApiResponse({ status: 200, type: [IntegrationResponseDto] })
  list(@CurrentUser() user: JwtPayload): Promise<IntegrationResponseDto[]> {
    return this.integrationsService.list(user.sub);
  }

  @Post(':key/connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connect an integration' })
  @ApiResponse({ status: 200, type: IntegrationResponseDto })
  connect(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
    @Body() dto: UpdateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    return this.integrationsService.connect(user.sub, key, dto);
  }

  @Post(':key/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect an integration' })
  @ApiResponse({ status: 200, type: IntegrationResponseDto })
  disconnect(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
  ): Promise<IntegrationResponseDto> {
    return this.integrationsService.disconnect(user.sub, key);
  }
}
