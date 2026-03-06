import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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
    
    // Setup Swagger
    const config = new DocumentBuilder()
      .setTitle('Family Management API')
      .setDescription('API documentation for Family Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    
    await app.init();
    cachedApp = app;
  }
  return cachedApp;
};

export default async (req: any, res: any) => {
  await createServer(server);
  server(req, res);
};
