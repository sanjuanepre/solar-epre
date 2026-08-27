import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: '*',
      credentials: true,
    });
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

// Exportamos el handler para Vercel Serverless
export default async (req: any, res: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (err: any) {
    console.error('[Bootstrap Error]', err);
    return res.status(500).json({
      error: 'BootstrapError',
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
};

// Desarrollo local
if (!process.env.VERCEL) {
  async function startLocal() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    await app.listen(process.env.PORT || 8080);
    console.log(`Local NestJS server running on port ${process.env.PORT || 8080}`);
  }
  startLocal();
}
