import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { FilesService } from './files.service';
import { FileContentDto, FileNodeDto } from './dto/file-node.dto';
import { WriteFileDto } from './dto/write-file.dto';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions/:sessionId/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the full workspace file/folder tree for a session' })
  getTree(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
  ): Promise<FileNodeDto> {
    return this.filesService.getTree(user.sub, sessionId);
  }

  @Get('content')
  @ApiOperation({ summary: "Read a file's contents (path relative to workspace root)" })
  getContent(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Query('path') path: string,
  ): Promise<FileContentDto> {
    return this.filesService.readFile(user.sub, sessionId, path);
  }

  @Put('content')
  @ApiOperation({ summary: 'Write/overwrite a file (path relative to workspace root)' })
  putContent(
    @CurrentUser() user: JwtPayload,
    @Param('sessionId') sessionId: string,
    @Query('path') path: string,
    @Body() body: WriteFileDto,
  ): Promise<{ path: string }> {
    return this.filesService.writeFile(user.sub, sessionId, path, body.content);
  }
}
