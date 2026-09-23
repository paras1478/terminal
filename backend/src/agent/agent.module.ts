import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SettingsModule } from '../settings/settings.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AgentService } from './agent.service';
import { AgentGateway } from './agent.gateway';

@Module({
  imports: [JwtModule.register({}), SettingsModule, AiModule, NotificationsModule],
  providers: [AgentService, AgentGateway],
  exports: [AgentService, AgentGateway],
})
export class AgentModule {}
