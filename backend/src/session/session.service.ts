import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * Запись одного HTTP-запроса в рамках сессии.
 */
export interface RequestLogEntry {
  /** ISO-строка момента запроса */
  timestamp: string;
  /** HTTP-метод (GET, POST, ...) */
  method: string;
  /** Паттерн маршрута (например, /api/v1/leaks/:prefix) — без реальных данных */
  route: string;
  /** HTTP-код ответа */
  statusCode: number;
  /** Время обработки запроса в миллисекундах */
  responseTimeMs: number;
}

/**
 * Данные пользовательской сессии.
 */
export interface SessionData {
  /** IP-адрес клиента */
  ip: string;
  /** User-Agent клиента */
  userAgent: string;
  /** Время создания сессии (ISO) */
  createdAt: string;
  /** Время последней активности (ISO) */
  lastSeenAt: string;
  /** Общее количество запросов в сессии */
  totalRequests: number;
  /** Количество проверок утечек (GET /leaks/:prefix) */
  leakChecks: number;
  /** Последние N записей активности */
  logs: RequestLogEntry[];
}

/**
 * SessionService — сервис логирования пользовательских сессий.
 *
 * Отслеживает активность по IP-адресу:
 *   - Количество запросов и проверок утечек
 *   - Время отклика каждого запроса
 *   - User-Agent и временные метки
 *
 * Данные хранятся в Redis с TTL 30 минут (скользящее окно —
 * TTL обновляется при каждом запросе).
 *
 * Конфиденциальность:
 *   - Значения prefix (часть хеша пароля) НИКОГДА не логируются
 *   - Сохраняется только паттерн маршрута (/leaks/:prefix)
 *   - Сессии автоматически истекают через 30 минут неактивности
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  /** Префикс для ключей Redis */
  private readonly KEY_PREFIX = 'session:';

  /** TTL сессии в секундах (30 минут, обновляется при каждом запросе) */
  private readonly SESSION_TTL = 1800;

  /** Максимальное количество записей лога в сессии */
  private readonly MAX_LOG_ENTRIES = 50;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Зафиксировать HTTP-запрос в сессии пользователя.
   *
   * Если сессия не существует — создаёт новую.
   * Если существует — обновляет счётчики и добавляет лог.
   * TTL сессии обновляется при каждом вызове (скользящее окно).
   */
  async trackRequest(
    ip: string,
    userAgent: string,
    entry: RequestLogEntry,
  ): Promise<void> {
    const key = `${this.KEY_PREFIX}${ip}`;
    const now = new Date().toISOString();
    const isLeakCheck = entry.route.includes('/leaks/');

    let session = await this.getSession(ip);

    if (session) {
      // ── Обновляем существующую сессию ────────────────────────
      session.lastSeenAt = now;
      session.totalRequests++;
      if (isLeakCheck) session.leakChecks++;

      session.logs.push(entry);
      // Оставляем только последние N записей
      if (session.logs.length > this.MAX_LOG_ENTRIES) {
        session.logs = session.logs.slice(-this.MAX_LOG_ENTRIES);
      }
    } else {
      // ── Создаём новую сессию ─────────────────────────────────
      session = {
        ip,
        userAgent,
        createdAt: now,
        lastSeenAt: now,
        totalRequests: 1,
        leakChecks: isLeakCheck ? 1 : 0,
        logs: [entry],
      };
      this.logger.log(`📝 Новая сессия: ${ip}`);
    }

    await this.redisService.set(key, JSON.stringify(session), this.SESSION_TTL);
  }

  /**
   * Получить данные сессии по IP-адресу.
   * Возвращает null, если сессия истекла или не существует.
   */
  async getSession(ip: string): Promise<SessionData | null> {
    const key = `${this.KEY_PREFIX}${ip}`;
    const raw = await this.redisService.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as SessionData;
    } catch {
      this.logger.warn('Повреждённые данные сессии — пропускаем');
      return null;
    }
  }
}
