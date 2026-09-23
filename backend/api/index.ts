import type { IncomingMessage, ServerResponse } from 'http';
import type { INestApplication } from '@nestjs/common';
import { createNestApp } from '../src/main';

// Vercel reuses a warm Lambda container across invocations, so cache the initialized
// Nest app (and its underlying Express instance) instead of re-bootstrapping per request.
let appPromise: Promise<INestApplication> | undefined;

async function getApp(): Promise<INestApplication> {
  if (!appPromise) {
    appPromise = createNestApp()
      .then(async (app) => {
        await app.init();
        return app;
      })
      .catch((err) => {
        // Allow a retry on the next invocation instead of caching a permanently broken app.
        appPromise = undefined;
        throw err;
      });
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance(req, res);
}
