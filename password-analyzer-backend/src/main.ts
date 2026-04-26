import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ─── 1. HELMET — строгие HTTP-заголовки безопасности ───
  app.use(
    helmet({
      // Content-Security-Policy: запрещаем всё, что не с нашего сервера (пурый API, без HTML)
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          scriptSrc: ["'none'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
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

  // ─── 5. Rate-limiting уже активен через ThrottlerGuard в AppModule ───


  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`🚀 API Gateway запущен на порту ${port}`);
  logger.log(`🛡️  CORS: разрешён только GET с ${process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000'}`);
  logger.log('🔒 Helmet активен (CSP, HSTS, X-Frame-Options, ...)');
  logger.log('⏱️  Rate limit: 10 запросов/сек/IP');
}
bootstrap();