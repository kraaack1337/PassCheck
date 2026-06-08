import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { LeaksModule } from './leaks/leaks.module';
import { RedisModule } from './redis/redis.module';
import { SessionModule } from './session/session.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        REDIS_HOST: Joi.string().default('redis'),
        REDIS_PORT: Joi.number().default(6379),
        FRONTEND_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ThrottlerModule.forRoot([
      {
        /**
         * ttl   — окно времени в миллисекундах (1000 мс = 1 секунда)
         * limit — максимальное кол-во запросов за это окно с одного IP
         */
        ttl: 1000,
        limit: 10,
      },
    ]),
    RedisModule,
    SessionModule,
    LeaksModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      // Регистрируем ThrottlerGuard глобально — он будет защищать все маршруты
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
