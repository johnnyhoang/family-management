import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';

console.log('ENTRY_POINT_LOADED');

const server = express();
let cachedApp: any;

const createServer = async (expressInstance: any) => {
  console.log('CREATE_SERVER_START');
  if (!cachedApp) {
    console.log('NEST_FACTORY_CREATE_START');
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressInstance),
      { logger: ['error', 'warn', 'log', 'debug', 'verbose'] }
    );
    
    app.enableCors({
      origin: true,
      credentials: true,
    });
    
    app.setGlobalPrefix('api/v1');
    
    // Setup Swagger
    const config = new DocumentBuilder()
      .setTitle('Family Management API')
      .setDescription('API documentation for Family Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    
    console.log('APP_INIT_START');
    await app.init();
    cachedApp = app;
    console.log('APP_INIT_SUCCESS');
  }
  return cachedApp;
};

export default async (req: any, res: any) => {
  // Fast diagnostic path
  if (req.url.endsWith('/api/v1/diagnostic')) {
    return res.status(200).json({
      status: 'entry_point_ok',
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DB_URL_SET: !!process.env.DATABASE_URL,
      }
    });
  }

  try {
    const app = await createServer(server);
    server(req, res);
  } catch (err: any) {
    console.error('NEST_FACTORY_ERROR:', err);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error during Nest initialization',
      error: err.message,
      stack: err.stack,
    });
  }
};
