import { INestApplication, Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/** Shared Nest app configuration used both for local/standalone hosting (app.listen)
 * and for the Vercel serverless entrypoint (api/index.ts), which never calls listen(). */
export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'https://terminal-1-riuw.onrender.com',
    credentials: true,
  });

  // Every HTTP controller route now lives under /api/v1 (e.g. POST /auth/login
  // becomes POST /api/v1/auth/login). This does NOT affect Socket.IO gateways
  // (terminal/agent/files) — @nestjs/websockets gateways are not routed
  // through Nest's HTTP router/setGlobalPrefix at all, so their namespace
  // URLs (e.g. wss://.../agent) are unchanged.
  app.setGlobalPrefix('api/v1', {
    // Keep Swagger's own UI/JSON reachable at its original path instead of
    // becoming /api/v1/api/docs.
    exclude: [{ path: 'api/docs', method: RequestMethod.ALL }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await createNestApp();

  // PORT is ONLY ever used here, to bind the server's own listener — never to
  // construct a browser-facing URL (see auth.controller.ts's frontendOrigin,
  // which uses the dedicated FRONTEND_URL/CORS_ORIGIN env vars instead).
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application listening on port ${port}`);
}

if (require.main === module) {
  void bootstrap();
}
