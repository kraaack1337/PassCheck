import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosError, type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { RedisService } from '../redis/redis.service';

/**
 * LeaksService — прокси к HaveIBeenPwned Range API.
 *
 * Реализует k-Anonymity модель:
 *   1. Клиент отправляет только первые 5 символов SHA-1 хэша пароля.
 *   2. Мы запрашиваем HIBP API и получаем список суффиксов хэшей.
 *   3. Клиент сам ищет свой суффикс в списке — сервер никогда не знает полный хэш.
 *
 * Кэш: Redis (с fallback на in-memory Map при недоступности Redis).
 * Ключи кэша: hibp:<prefix>, TTL = 1 час.
 */
@Injectable()
export class LeaksService {
  private readonly logger = new Logger(LeaksService.name);

  private readonly HIBP_API_URL = 'https://api.pwnedpasswords.com/range';

  /** Префикс для ключей Redis — изолирует пространство имён */
  private readonly CACHE_KEY_PREFIX = 'hibp:';

  /** TTL кэша в секундах (1 час) */
  private readonly CACHE_TTL = 3600;

  /** Axios-инстанс с retry-логикой и User-Agent */
  private readonly httpClient: AxiosInstance;

  constructor(private readonly redisService: RedisService) {
    this.httpClient = axios.create({
      baseURL: this.HIBP_API_URL,
      // Таймаут 10 секунд — достаточно даже для медленных сетей
      timeout: 10_000,
      // Ответ HIBP — plain text, не JSON
      responseType: 'text',
      headers: {
        /**
         * User-Agent обязателен — HIBP может блокировать запросы без него.
         * https://haveibeenpwned.com/API/v3#UserAgent
         */
        'User-Agent': 'PasswordAnalyzer/1.0',
        /**
         * Add-Padding: true — HIBP дополняет ответ случайными записями
         * до фиксированного размера, что усложняет traffic analysis.
         * Подробнее: https://haveibeenpwned.com/API/v3#PwnedPasswordsPadding
         */
        'Add-Padding': 'true',
      },
    });

    // ── Retry: 3 попытки с exponential backoff ──────────────────────────
    axiosRetry(this.httpClient, {
      retries: 3,
      // Задержка: ~1с, ~2с, ~4с (exponential backoff)
      retryDelay: axiosRetry.exponentialDelay,
      // Повторяем при сетевых ошибках и 5xx
      retryCondition: (error) =>
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response?.status !== undefined && error.response.status >= 500),
      onRetry: (retryCount) => {
        this.logger.warn(`HIBP API — повторная попытка #${retryCount}`);
      },
    });
  }

  /**
   * Возвращает список суффиксов SHA-1 хэшей для заданного prefix.
   * Сначала проверяет Redis-кэш, при промахе — делает запрос к HIBP.
   *
   * ВАЖНО: prefix намеренно не логируется — это часть пользовательских данных.
   */
  async getHashSuffixes(prefix: string): Promise<string> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${prefix}`;

    // ── Шаг 1: Проверяем Redis-кэш ─────────────────────────────────────
    const cached = await this.redisService.get(cacheKey);

    if (cached !== null) {
      this.logger.debug('Cache HIT — возвращаем закэшированный результат');
      return cached;
    }

    // ── Шаг 2: Запрашиваем HIBP Range API ────────────────────────────────
    this.logger.debug('Cache MISS — обращаемся к HaveIBeenPwned API');

    try {
      const response = await this.httpClient.get<string>(`/${prefix}`);

      const data = response.data as string;

      // ── Шаг 3: Кэшируем результат в Redis с TTL ──────────────────────
      await this.redisService.set(cacheKey, data, this.CACHE_TTL);
      this.logger.debug('Результат закэширован в Redis (TTL: 1 час)');

      return data;
    } catch (error) {
      // Расширенное логирование для диагностики сетевых проблем
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 'нет ответа';
        const code = error.code ?? 'unknown';
        const message = error.message ?? '';
        this.logger.error(
          `Ошибка при обращении к HIBP API. ` +
            `HTTP статус: ${status}, код: ${code}, сообщение: ${message}`,
        );
      } else {
        this.logger.error(
          `Неизвестная ошибка при обращении к HIBP API: ${error}`,
        );
      }

      throw new InternalServerErrorException(
        'Не удалось получить данные от HaveIBeenPwned API. Попробуйте позже.',
      );
    }
  }
}
