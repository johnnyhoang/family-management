import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

console.log('--- VERCEL_FUNCTION_LOADED ---');

let cachedHandler: any;

async function bootstrap() {
  if (cachedHandler) return cachedHandler;
  
  console.log('--- BOOTSTRAP_START ---');
  const expressApp = express();
  
  const nestApp = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { logger: ['error', 'warn', 'log'] }
  );

  nestApp.enableCors({
    origin: true,
    credentials: true,
  });

  nestApp.setGlobalPrefix('api/v1');
  
  await nestApp.init();
  cachedHandler = expressApp;
  console.log('--- BOOTSTRAP_COMPLETE ---');
  return cachedHandler;
}

export default async (req: any, res: any) => {
  // Ultra-fast diagnostic path (No AppModule, No NestJS)
  if (req.url.includes('/api/v1/diagnostic')) {
    console.log('DIAGNOSTIC_PATH_HIT');
    return res.status(200).json({
      status: 'ok',
      message: 'Vercel Function is alive!',
      timestamp: new Date().toISOString(),
      node: process.version,
      cwd: process.cwd(),
      env_sample: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        REDIS_ENABLED: process.env.REDIS_ENABLED,
      }
    });
  }

  try {
    const handler = await bootstrap();
    return handler(req, res);
  } catch (err: any) {
    console.error('--- BOOTSTRAP_ERROR ---');
    console.error(err);
    return res.status(500).json({
      statusCode: 500,
      message: 'NestJS Initialization Failed',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
