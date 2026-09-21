import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SettingsModule } from '../settings/settings.module';
import { AgentService } from './agent.service';
import { AgentGateway } from './agent.gateway';

@Module({
  imports: [JwtModule.register({}), SettingsModule],
  providers: [AgentService, AgentGateway],
  exports: [AgentService, AgentGateway],
})
export class AgentModule {}
