const { NestFactory } = require('@nestjs/core');

let cachedApp = null;

async function bootstrap() {
  if (!cachedApp) {
    try {
      console.log('Bootstrapping NestJS...');
      const { AppModule } = require('../dist/app.module');
      console.log('AppModule required successfully');
      const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log', 'debug'] });
      console.log('NestFactory.create completed');
      app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
      });
      await app.init();
      console.log('NestJS app initialized');
      cachedApp = app.getHttpAdapter().getInstance();
    } catch (err) {
      console.error('Error during NestJS bootstrap:', err);
      throw err;
    }
  }
  return cachedApp;
}

module.exports = async (req, res) => {
  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (err) {
    res.status(500).json({
      error: 'BootstrapError',
      message: err.message,
      stack: err.stack,
      path: __dirname,
      files: require('fs').readdirSync(__dirname),
      parentFiles: require('fs').readdirSync(require('path').join(__dirname, '..'))
    });
  }
};
