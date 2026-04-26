import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { LeaksModule } from './leaks/leaks.module';

@Module({
  imports: [
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
