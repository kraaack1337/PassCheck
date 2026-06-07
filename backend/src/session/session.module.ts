import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SessionService } from './session.service';
import { SessionInterceptor } from './session.interceptor';

/**
 * SessionModule — глобальный модуль логирования сессий.
 *
 * При импорте в AppModule автоматически:
 *   1. Регистрирует SessionInterceptor на ВСЕ маршруты (APP_INTERCEPTOR)
 *   2. Экспортирует SessionService для использования в других модулях
 *
 * Данные хранятся в Redis (через RedisModule).
 */
@Global()
@Module({
  providers: [
    SessionService,
    {
      // Регистрируем перехватчик глобально — он будет логировать все запросы
      provide: APP_INTERCEPTOR,
      useClass: SessionInterceptor,
    },
  ],
  exports: [SessionService],
})
export class SessionModule {}
