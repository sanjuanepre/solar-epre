import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Express } from 'express';
import { Auth } from 'googleapis';
import * as dotenv from 'dotenv';
import { MailService } from './send-email.service';
import { FileInterceptor } from '@nestjs/platform-express';
dotenv.config();

const { OAuth2Client } = Auth;

@Controller('gmail')
export class SendEmailController {
 
  body: string = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Visita</title>
  <style>
    body {
      font-family: 'Roboto', sans-serif;
      background-color: #f4f4f9;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      border: 1px solid #e5e5e5;
    }

    h1 {
      color: #2c3e50;
      font-size: 24px;
      margin-bottom: 10px;
    }

    p {
      color: #4f4f4f;
      font-size: 16px;
      line-height: 1.6;
      margin: 15px 0;
    }

    .highlight {
      color: #e67e22;
      font-weight: bold;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
    }

    .footer p {
      color: #bdc3c7;
      font-size: 12px;
    }

    .footer a {
      color: #3498db;
      text-decoration: none;
    }

    .button {
      display: inline-block;
      padding: 10px 20px;
      margin: 20px 0;
      background-color: #16a085;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-size: 14px;
    }

    .button:hover {
      background-color: #138d75;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Gracias por utilizar la app Generación Solar Distribuida San Juan</h1>
    <p>Hola, muchas gracias por utilizar la app Generación Solar Distribuida San Juan.</p>
    <p>Podrás visualizar los <span class="highlight">RESULTADOS DE TU SIMULACIÓN</span> en el documento adjunto al presente, en formato PDF.</p>
    <p>En caso de recibir este correo por error, por favor desestimar el mismo.</p>
    <p>Si tienes alguna duda y/o consulta no dudes en comunicarte con el E.P.R.E. a través de nuestros canales de atención, detallados en el sitio web: <a href="https://epresanjuan.gob.ar/contacto-2/">https://epresanjuan.gob.ar/contacto-2/</a>.</p>

    <a href="http://solar.epresanjuan.gob.ar" class="button">Visita nuestro sitio</a>

    <div class="footer">
      <p>&copy; 2024 Solar EPRE San Juan | Todos los derechos reservados</p>
    </div>
  </div>
</body>
</html>
`;
  constructor(private readonly mailService: MailService) {}

  @Post('send-email')
  @UseInterceptors(FileInterceptor('file'))
  async sendEmailWithAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    await this.mailService.sendEmail(
      email,
      'Generación Solar Distribuida San Juan - RESULTADOS DE TU SIMULACIÓN',
      this.body,
      file,
    );
    console.log('Archivo recibido:', file);
    console.log('Enviar a:', email);

    return { message: 'Correo enviado correctamente con el archivo adjunto' };
  }

  @Get('send-email-change')
  async sendEmailChangeCapacityInApi(
    @Query('newPanelCapacityW') newPanelCapacityW: number,
  ) {
    await this.mailService.sendEmail(
      'spereyra.jus@gmail.com',
      'Información de actualización',
      `<h1>Actualización cambio en API solar</h1><p>Google ha actualizado la potencia de los paneles como base para sus calculos solares.</p><p>La nueva potencia es de ${newPanelCapacityW} w`,
    );
  }

  getCategory() {
   return ""
  }
  getPanelsCapacity() {
   return ""
  }
  getPanelsCount() {
   return ""
  }
  getCoordinates() {
   return ""
  }
  getUbication() {
   return ""
  }
}
