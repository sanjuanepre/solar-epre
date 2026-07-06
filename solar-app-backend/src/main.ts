import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors({
      origin: '*', // Permite todos los orígenes
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

// Exportamos el manejador HTTP para Vercel
export default async function (req: any, res: any) {
  const app = await bootstrap();
  return app(req, res);
}

// Si no estamos en Vercel, levantamos el servidor normalmente (para desarrollo local)
if (!process.env.VERCEL) {
  async function startLocal() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    await app.listen(process.env.PORT || 8080);
  }
  startLocal();
}
