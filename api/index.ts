import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from '../server/src/app.module';

let cachedApp: INestApplication;

async function getApp(): Promise<INestApplication> {
  if (!cachedApp) {
    console.log('--- NEST_BOOTSTRAP_START ---');
    cachedApp = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    cachedApp.use(compression());

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
  // Ultra-fast diagnostic path
  if (req.url?.includes('/api/v1/diagnostic') || req.url?.includes('/api/diagnostic')) {
    const hasDbUrl = Boolean(process.env.DATABASE_URL);
    const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
    const hasAnonKey = Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);
    const hasJwtSecret = Boolean(process.env.JWT_SECRET);

    let dbCheck = 'untested';
    let dbError: string | null = null;

    try {
      const app = await getApp();
      dbCheck = 'connected';
    } catch (e: any) {
      dbCheck = 'failed';
      dbError = e?.message || String(e);
    }

    return res.status(200).json({
      status: dbCheck === 'connected' ? 'ok' : 'degraded',
      message: 'Vercel Diagnostic Report',
      timestamp: new Date().toISOString(),
      node: process.version,
      env: {
        DATABASE_URL: hasDbUrl ? 'configured' : 'MISSING',
        SUPABASE_URL: hasSupabaseUrl ? 'configured' : 'MISSING',
        SUPABASE_ANON_KEY: hasAnonKey ? 'configured' : 'MISSING',
        JWT_SECRET: hasJwtSecret ? 'configured' : 'MISSING',
      },
      database: dbCheck,
      databaseError: dbError,
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
      message: 'Khởi tạo máy chủ thất bại: ' + (err.message || 'Lỗi không xác định'),
      error: err.message,
    });
  }
};
