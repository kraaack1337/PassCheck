import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  // ─── 1. HELMET — строгие HTTP-заголовки безопасности ───
  app.use(
    helmet({
      // Content-Security-Policy: запрещаем всё, что не с нашего сервера (пурый API, без HTML)
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow Swagger UI scripts
          styleSrc: ["'self'", "'unsafe-inline'"],  // Allow Swagger UI styles
          imgSrc: ["'self'", 'data:'],              // Allow Swagger UI images
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          connectSrc: ["'self'"],                   // Allow Swagger UI to make API requests
        },
      },
      // HSTS: браузер обязан работать только через HTTPS (важно в продакшне)
      strictTransportSecurity: {
        maxAge: 31536000, // 1 год в секундах
        includeSubDomains: true,
      },
      // X-Frame-Options: защита от clickjacking
      frameguard: { action: 'deny' },
      // X-Content-Type-Options: запрещаем MIME-сниффинг
      noSniff: true,
      // Referrer-Policy: не передаём referer при переходе на внешний ресурс
      referrerPolicy: { policy: 'no-referrer' },
      // X-Powered-By убирается автоматически (helmet делает это по умолчанию)
      hidePoweredBy: true,
      // crossOriginEmbedderPolicy / crossOriginOpenerPolicy / crossOriginResourcePolicy
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    }),
  );

  // ─── 2. CORS — разрешаем только GET с фронтенда ───
  app.enableCors({
    // Замени на продакшный домен при деплоементе
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    // Пароли НИКОГДА не должны передаваться через POST-тело — только GET
    methods: ['GET'],
    // Не передаём cookies/credentials на кросс-оригин запросы
    credentials: false,
  });

  // ─── 3. Глобальный префикс — все маршруты будут доступны под /api/v1/* ───
  app.setGlobalPrefix('api/v1');

  // ─── 4. Глобальный ValidationPipe — автоматическая валидация всех DTO ───
  app.useGlobalPipes(
    new ValidationPipe({
      // Трансформируем входящие данные в экземпляры DTO-классов
      transform: true,
      // Отбрасываем поля, которых нет в DTO — защита от лишних данных
      whitelist: true,
      // Останавливаемся на первой ошибке — не раскрываем структуру DTO целиком
      stopAtFirstError: true,
    }),
  );

  // ─── 4.5 Глобальный фильтр исключений ───
  app.useGlobalFilters(new AllExceptionsFilter());

  // ─── 5. Rate-limiting уже активен через ThrottlerGuard в AppModule ───

  // ─── 6. Swagger API Documentation ───
  const config = new DocumentBuilder()
    .setTitle('PassCheck API')
    .setDescription('The API documentation for PassCheck Password Analyzer')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);


  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 API Gateway запущен на порту ${port}`);
  logger.log(`🛡️  CORS: разрешён только GET с ${process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'}`);
  logger.log('🔒 Helmet активен (CSP, HSTS, X-Frame-Options, ...)');
  logger.log('⏱️  Rate limit: 10 запросов/сек/IP');
}
bootstrap();