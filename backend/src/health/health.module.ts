import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * HealthModule — модуль для health-check эндпоинта.
 *
 * Инкапсулирует HealthController.
 * Используется Docker HEALTHCHECK, Nginx upstream-проверками
 * и внешними мониторинговыми сервисами.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
