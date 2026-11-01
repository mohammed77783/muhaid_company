import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // the React inspector app and the admin dashboard call this API from the browser
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
