import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FilesGateway } from './files.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [FilesController],
  providers: [FilesService, FilesGateway],
})
export class FilesModule {}
