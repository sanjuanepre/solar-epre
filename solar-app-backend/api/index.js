const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

let app;
let expressApp;

async function bootstrap() {
  if (!expressApp) {
    expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const { AppModule } = require('../dist/app.module');
    const nestApp = await NestFactory.create(AppModule, adapter, { logger: false });
    nestApp.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    await nestApp.init();
  }
  return expressApp;
}

module.exports = async (req, res) => {
  const server = await bootstrap();
  return server(req, res);
};
