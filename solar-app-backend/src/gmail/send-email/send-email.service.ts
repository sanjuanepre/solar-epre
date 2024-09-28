import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'epresjsolar@gmail.com',
        pass: process.env.PASS_GMAIL,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    file?: Express.Multer.File,
  ) {
    const transporter = this.transporter;

    const mailOptions: nodemailer.Options = {
      from: 'epresjsolar@gmail.com',
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
