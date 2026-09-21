import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ContentService } from './content.service';
import { UpsertHomepageContentDto } from './dto/upsert-homepage-content.dto';
import { HomepageContentResponseDto } from './dto/homepage-content-response.dto';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'List all homepage content sections' })
  @ApiResponse({ status: 200, type: [HomepageContentResponseDto] })
  findAll(): Promise<HomepageContentResponseDto[]> {
    return this.contentService.findAll();
  }

  @Get(':section')
  @ApiOperation({ summary: 'Get homepage content for a single section' })
  @ApiResponse({ status: 200, type: HomepageContentResponseDto })
  findOne(
    @Param('section') section: string,
  ): Promise<HomepageContentResponseDto> {
    return this.contentService.findOne(section);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update a homepage content section (admin only)',
  })
  @ApiResponse({ status: 201, type: HomepageContentResponseDto })
  upsert(
    @Body() dto: UpsertHomepageContentDto,
  ): Promise<HomepageContentResponseDto> {
    return this.contentService.upsert(dto);
  }
}
