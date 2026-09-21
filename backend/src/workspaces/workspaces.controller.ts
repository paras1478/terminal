import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceDetailResponseDto } from './dto/workspace-detail-response.dto';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List workspace cards' })
  @ApiResponse({ status: 200, type: [WorkspaceResponseDto] })
  list(@CurrentUser() user: JwtPayload): Promise<WorkspaceResponseDto[]> {
    return this.workspacesService.list(user.sub);
  }

  @Delete('all')
  @ApiOperation({ summary: 'TEMP: delete all workspace/session/task/automation data for the current user' })
  clearAllData(@CurrentUser() user: JwtPayload) {
    return this.workspacesService.clearAllData(user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get workspace detail including integrations and recent activity',
  })
  @ApiResponse({ status: 200, type: WorkspaceDetailResponseDto })
  getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<WorkspaceDetailResponseDto> {
    return this.workspacesService.getDetail(user.sub, id);
  }
}
