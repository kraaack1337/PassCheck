import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

/**
 * RedisService — обёртка над ioredis-клиентом.
 *
 * Обеспечивает:
 *   - Автоматическое подключение при старте модуля
 *   - Graceful shutdown при остановке приложения
 *   - Fallback на in-memory Map, если Redis недоступен
 *   - Логирование всех событий подключения/разрыва
 *
 * Конфигурируется через переменные окружения:
 *   - REDIS_HOST (по умолчанию: 'redis')
 *   - REDIS_PORT (по умолчанию: 6379)
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  /** Флаг доступности Redis — если false, используется fallback-кэш */
  private isConnected = false;

  /** Fallback in-memory кэш на случай недоступности Redis */
  private readonly fallbackCache = new Map<string, string>();

  /** TTL кэша в секундах (по умолчанию 1 час) */
  private readonly DEFAULT_TTL = 3600;

  async onModuleInit(): Promise<void> {
    const host = process.env.REDIS_HOST ?? 'redis';
    const port = parseInt(process.env.REDIS_PORT ?? '6379', 10);

    this.logger.log(`Подключение к Redis: ${host}:${port}...`);

    this.client = new Redis({
      host,
      port,
      // Не блокируем старт приложения, если Redis недоступен
      lazyConnect: true,
      // Повторные подключения с экспоненциальной задержкой (макс. 5с)
      retryStrategy: (times: number) => {
        if (times > 10) {
          this.logger.warn(
            'Redis: превышено максимальное кол-во попыток подключения. ' +
              'Переключаемся на in-memory fallback.',
          );
          return null; // Прекращаем попытки переподключения
        }
        return Math.min(times * 500, 5000);
      },
      // Таймаут подключения
      connectTimeout: 5000,
      // Максимальное кол-во попыток переподключения
      maxRetriesPerRequest: 3,
    });

    // ── Обработчики событий ─────────────────────────────────────
    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('✅ Redis: подключение установлено');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.logger.log('✅ Redis: клиент готов к работе');
    });

    this.client.on('error', (err: Error) => {
      this.isConnected = false;
      this.logger.error(`❌ Redis: ошибка — ${err.message}`);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.warn('⚠️  Redis: соединение закрыто');
    });

    this.client.on('reconnecting', () => {
      this.logger.log('🔄 Redis: переподключение...');
    });

    // ── Попытка подключения ────────────────────────────────────
    try {
      await this.client.connect();
    } catch (err) {
      this.isConnected = false;
      this.logger.warn(
        `⚠️  Redis: не удалось подключиться (${(err as Error).message}). ` +
          'Работаем через in-memory fallback.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.logger.log('Закрытие соединения с Redis...');
      await this.client.quit();
      this.logger.log('Redis: соединение корректно закрыто');
    }
  }

  /**
   * Получить значение из кэша.
   * При недоступности Redis используется fallback Map.
   */
  async get(key: string): Promise<string | null> {
    if (this.isConnected) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(
          `Redis GET ошибка: ${(err as Error).message}. Пробуем fallback.`,
        );
      }
    }
    return this.fallbackCache.get(key) ?? null;
  }

  /**
   * Сохранить значение в кэш с TTL.
   * При недоступности Redis сохраняет в fallback Map.
   *
   * @param key   — ключ кэша
   * @param value — значение
   * @param ttl   — время жизни в секундах (по умолчанию 1 час)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    const effectiveTtl = ttl ?? this.DEFAULT_TTL;

    if (this.isConnected) {
      try {
        await this.client.set(key, value, 'EX', effectiveTtl);
        return;
      } catch (err) {
        this.logger.warn(
          `Redis SET ошибка: ${(err as Error).message}. Пробуем fallback.`,
        );
      }
    }

    // Fallback: сохраняем в Map (без TTL — очищается при рестарте)
    this.fallbackCache.set(key, value);
  }

  /**
   * Проверить, подключен ли Redis.
   * Используется для health-check endpoint.
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
