import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Bank sync validation')
    .setDescription('Validate banking operations vs statement balances.')
    .setVersion('1.0')
    .addTag('movements', 'Movements and balance checkpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  app.use('/api', apiReference({ content: document, theme: 'kepler' }));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
