import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

let cachedServer: any;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

// Exportamos el handler para Vercel Serverless
export default async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};

// Desarrollo local
if (!process.env.VERCEL) {
  async function startLocal() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
