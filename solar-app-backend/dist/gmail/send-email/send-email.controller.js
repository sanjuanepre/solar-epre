"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmailController = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const dotenv = require("dotenv");
const send_email_service_1 = require("./send-email.service");
const platform_express_1 = require("@nestjs/platform-express");
dotenv.config();
const { OAuth2Client } = googleapis_1.Auth;
let SendEmailController = class SendEmailController {
    constructor(mailService) {
        this.mailService = mailService;
        this.body = `<!DOCTYPE html>
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

    <a href="https://solar.epresanjuan.gob.ar" class="button">Visita nuestro sitio</a>

    <div class="footer">
      <p>&copy; 2024 GSDSJ - E.P.R.E. San Juan</p>
    </div>
  </div>
</body>
</html>
`;
    }
    async sendEmailWithAttachment(file, email) {
        await this.mailService.sendEmail(email, 'Generación Solar Distribuida San Juan - RESULTADOS DE TU SIMULACIÓN', this.body, file);
        console.log('Archivo recibido:', file);
        console.log('Enviar a:', email);
        return { message: 'Correo enviado correctamente con el archivo adjunto' };
    }
    async sendEmailChangeCapacityInApi(newPanelCapacityW) {
        await this.mailService.sendEmail(process.env.USER_GMAIL || 'epresjsolar@gmail.com', 'Información de actualización', `<h1>Actualización cambio en API solar</h1><p>Google ha actualizado la potencia de los paneles como base para sus calculos solares.</p><p>La nueva potencia es de ${newPanelCapacityW} w`);
    }
    getCategory() {
        return "";
    }
    getPanelsCapacity() {
        return "";
    }
    getPanelsCount() {
        return "";
    }
    getCoordinates() {
        return "";
    }
    getUbication() {
        return "";
    }
};
exports.SendEmailController = SendEmailController;
__decorate([
    (0, common_1.Post)('send-email'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SendEmailController.prototype, "sendEmailWithAttachment", null);
__decorate([
    (0, common_1.Get)('send-email-change'),
    __param(0, (0, common_1.Query)('newPanelCapacityW')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SendEmailController.prototype, "sendEmailChangeCapacityInApi", null);
exports.SendEmailController = SendEmailController = __decorate([
    (0, common_1.Controller)('gmail'),
    __metadata("design:paramtypes", [send_email_service_1.MailService])
], SendEmailController);
//# sourceMappingURL=send-email.controller.js.map