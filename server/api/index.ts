import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

const createServer = async (expressInstance: any) => {
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
};

export default async (req: any, res: any) => {
  await createServer(server);
  server(req, res);
};
