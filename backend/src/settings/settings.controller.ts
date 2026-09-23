import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { ValidateApiKeyDto } from './dto/validate-api-key.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences and safety configuration' })
  @ApiResponse({ status: 200, type: SettingsResponseDto })
  get(@CurrentUser() user: JwtPayload): Promise<SettingsResponseDto> {
    return this.settingsService.get(user.sub);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user preferences and safety configuration' })
  @ApiResponse({ status: 200, type: SettingsResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSettingsDto,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.update(user.sub, dto);
  }

  @Delete('api-keys/:provider')
  @ApiOperation({ summary: 'Remove a stored API key for a provider' })
  @ApiResponse({ status: 200, type: SettingsResponseDto })
  deleteApiKey(
    @CurrentUser() user: JwtPayload,
    @Param('provider') provider: string,
  ): Promise<SettingsResponseDto> {
    return this.settingsService.deleteApiKey(user.sub, provider);
  }

  @Post('api-keys/validate')
  @ApiOperation({ summary: 'Validate an API key against its provider before saving' })
  @ApiResponse({ status: 200, description: '{ valid: boolean, message?: string }' })
  validateApiKey(
    @Body() dto: ValidateApiKeyDto,
  ): Promise<{ valid: boolean; message?: string }> {
    return this.settingsService.validateApiKey(dto.provider, dto.apiKey);
  }
}
