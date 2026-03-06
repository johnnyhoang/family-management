import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

let cachedApp: INestApplication;

async function getApp(): Promise<INestApplication> {
  if (!cachedApp) {
    console.log('--- NEST_BOOTSTRAP_START ---');
    cachedApp = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    cachedApp.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    cachedApp.enableCors({
      origin: true,
      credentials: true,
    });

    cachedApp.setGlobalPrefix('api/v1', {
      exclude: ['/', 'status'],
    });

    // Get the underlying express instance to set proxy trust
    const expressInstance = cachedApp.getHttpAdapter().getInstance();
    if (expressInstance && typeof expressInstance.set === 'function') {
      expressInstance.set('trust proxy', 1);
    }

    await cachedApp.init();
    console.log('--- NEST_BOOTSTRAP_COMPLETE ---');
  }
  return cachedApp;
}

export default async (req: any, res: any) => {
  // Ultra-fast diagnostic path (No AppModule, No NestJS)
  if (req.url.includes('/api/v1/diagnostic')) {
    return res.status(200).json({
      status: 'ok',
      message: 'Vercel Function is alive!',
      timestamp: new Date().toISOString(),
      node: process.version,
    });
  }

  try {
    const app = await getApp();
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
  } catch (err: any) {
    console.error('--- VERCEL_HANDLER_ERROR ---');
    console.error(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'Server Initialization Failed',
      error: err.message,
    });
  }
};
