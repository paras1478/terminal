import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { ContactModule } from './contact/contact.module';
import { DemoRequestsModule } from './demo-requests/demo-requests.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { EventsModule } from './events/events.module';
import { ContentModule } from './content/content.module';
import { OverviewModule } from './overview/overview.module';
import { SessionsModule } from './sessions/sessions.module';
import { TasksModule } from './tasks/tasks.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { AutomationsModule } from './automations/automations.module';
import { LogsModule } from './logs/logs.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SettingsModule } from './settings/settings.module';
import { UploadsModule } from './uploads/uploads.module';
import { AgentModule } from './agent/agent.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL ?? 60000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 20),
      },
    ]),
    PrismaModule,
    AuthModule,
    HealthModule,
    WaitlistModule,
    ContactModule,
    DemoRequestsModule,
    NewsletterModule,
    EventsModule,
    ContentModule,
    OverviewModule,
    SessionsModule,
    TasksModule,
    WorkspacesModule,
    AutomationsModule,
    LogsModule,
    IntegrationsModule,
    SettingsModule,
    UploadsModule,
    AgentModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
