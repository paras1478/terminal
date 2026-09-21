import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AgentModule } from '../agent/agent.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { TerminalGateway } from './terminal.gateway';

@Module({
  imports: [JwtModule.register({}), AgentModule],
  controllers: [SessionsController],
  providers: [SessionsService, TerminalGateway],
})
export class SessionsModule {}
