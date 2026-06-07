import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * RedisModule — глобальный модуль для работы с Redis-кэшем.
 *
 * Помечен как @Global(), чтобы RedisService был доступен
 * во всех модулях приложения без явного импорта.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
