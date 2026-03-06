import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let cachedApp: any;

const createServer = async (expressInstance: any) => {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressInstance),
    );
    
    app.enableCors({
      origin: true,
      credentials: true,
    });
    
    app.setGlobalPrefix('api/v1');
    
    await app.init();
    cachedApp = app;
  }
  return cachedApp;
};

export default async (req: any, res: any) => {
  await createServer(server);
  server(req, res);
};
