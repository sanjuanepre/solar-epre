const { NestFactory } = require('@nestjs/core');

let cachedApp = null;

async function bootstrap() {
  if (!cachedApp) {
    const { AppModule } = require('../dist/app.module');
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance();
  }
  return cachedApp;
}

module.exports = async (req, res) => {
  const server = await bootstrap();
  return server(req, res);
};
