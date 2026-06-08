import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { SessionService, RequestLogEntry } from '../../session/session.service';

/**
 * SessionInterceptor — глобальный перехватчик для логирования сессий.
 *
 * Автоматически фиксирует каждый HTTP-запрос:
 *   - IP-адрес, User-Agent, маршрут, статус-код, время ответа
 *   - Работает на ВСЕХ маршрутах (leaks, health)
 *   - Пропускает Docker health-check запросы (wget без User-Agent)
 *
 * Безопасность:
 *   - Логирует только паттерн маршрута (/leaks/:prefix), НЕ реальные значения
 *   - Ошибки логирования НЕ влияют на ответ клиенту (fire-and-forget)
 */
@Injectable()
export class SessionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SessionInterceptor.name);

  constructor(private readonly sessionService: SessionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();

    // ── Пропускаем Docker health-check запросы ──────────────────
    if (this.isHealthCheck(request)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      // ── Успешный ответ ────────────────────────────────────────
      tap(() => {
        const response = httpCtx.getResponse<Response>();
        this.trackSafe(request, response.statusCode, Date.now() - startTime);
      }),
      // ── Ошибка — логируем, но пробрасываем дальше ────────────
      catchError((error) => {
        const statusCode =
          error?.status ?? error?.getStatus?.() ?? 500;
        this.trackSafe(request, statusCode, Date.now() - startTime);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Fire-and-forget запись в сессию.
   * Ошибки логирования НЕ прерывают обработку запроса.
   */
  private trackSafe(
    request: Request,
    statusCode: number,
    responseTimeMs: number,
  ): void {
    const ip = this.extractIp(request);
    const userAgent = request.headers['user-agent'] ?? 'unknown';
    const route = this.getSafeRoute(request);

    const entry: RequestLogEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      route,
      statusCode,
      responseTimeMs,
    };

    this.sessionService.trackRequest(ip, userAgent, entry).catch((err) => {
      this.logger.warn(
        `Ошибка логирования сессии: ${(err as Error).message}`,
      );
    });
  }

  /**
   * Извлечь реальный IP клиента.
   * Учитывает заголовок X-Forwarded-For (Nginx проксирует запросы).
   */
  private extractIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip ?? 'unknown';
  }

  /**
   * Получить безопасный паттерн маршрута (без реальных данных).
   *
   * Использует Express route pattern, если доступен:
   *   /api/v1/leaks/:prefix  (✅ безопасно)
   * Иначе — вырезает реальный prefix из URL:
   *   /api/v1/leaks/7A6B4 → /api/v1/leaks/:prefix
   */
  private getSafeRoute(request: Request): string {
    if (request.route?.path) {
      return request.route.path as string;
    }
    // Fallback: маскируем потенциальные prefix-значения
    return request.path.replace(
      /\/leaks\/[a-fA-F0-9]+/,
      '/leaks/:prefix',
    );
  }

  /**
   * Определить, является ли запрос Docker health-check.
   * Docker вызывает `wget -q --spider http://localhost:3001/api/v1/health`
   * каждые 10-15 секунд — не нужно засорять сессии.
   */
  private isHealthCheck(request: Request): boolean {
    return (
      request.path === '/api/v1/health' &&
      (!request.headers['user-agent'] ||
        request.headers['user-agent'].startsWith('Wget'))
    );
  }
}
