import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'; // Importa NestExpressApplication
import * as path from 'path';
import * as express from 'express';

import { join } from 'path';
import { Request, Response } from 'express'; // Importa los tipos de Express

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(express.static(path.join(__dirname, 'public')));

  // Redirigir todas las rutas no coincidentes al index.html de Angular
  app.use((req: Request, res: Response, next: () => void) => {
    if (req.url.startsWith('/api')) {
      // Si es una ruta de API, continúa
      next();
    } else {
      // Si no es una ruta de API, redirige a index.html
      res.sendFile(join(__dirname, '..', 'public/index.html'));
    }
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
