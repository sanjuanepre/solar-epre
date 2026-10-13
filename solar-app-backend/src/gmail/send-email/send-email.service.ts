import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private getTransporter(): nodemailer.Transporter {
    const user = process.env.USER_GMAIL || 'spereyra.jus@gmail.com';
    const rawPass = process.env.PASS_GMAIL;
    if (!rawPass) {
      throw new Error(
        'La variable PASS_GMAIL no está configurada en las variables de entorno de Vercel. Por favor configure la contraseña de aplicación de 16 caracteres de Google en Vercel Dashboard.'
      );
    }
    const pass = rawPass.replace(/\s+/g, '');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    file?: Express.Multer.File,
  ) {
    const user = process.env.USER_GMAIL || 'spereyra.jus@gmail.com';
    const transporter = this.getTransporter();

    const mailOptions: nodemailer.Options = {
      from: `"Generación Solar Distribuida San Juan" <${user}>`,
      to,
      subject,
      html: htmlContent,
    };

    // Si el archivo está presente, añadirlo como adjunto
    if (file) {
      mailOptions.attachments = [
        {
          filename: file.originalname,
          content: file.buffer,
          contentType: file.mimetype,
        },
      ];
    }

    await transporter.sendMail(mailOptions);
  }
}
