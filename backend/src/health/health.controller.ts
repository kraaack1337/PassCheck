import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

/**
 * HealthController — утилитарный контроллер для систем мониторинга.
 * Используется Docker HEALTHCHECK, Nginx upstream-проверками и внешними
 * мониторинговыми сервисами (UptimeRobot, Grafana и т.п.).
 *
 * Полный путь: GET /api/v1/health
 * (префикс 'api/v1' задаётся глобально через app.setGlobalPrefix в main.ts)
 */
@Controller('health')
export class HealthController {
  /**
   * GET /api/v1/health
   *
   * Возвращает:
   *   { "status": "ok", "timestamp": "2026-04-25T08:57:45.123Z" }
   *
   * HTTP 200 — сервис работает нормально.
   * Мониторинговые системы считают всё, что не 2xx, сбоем.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  check(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
