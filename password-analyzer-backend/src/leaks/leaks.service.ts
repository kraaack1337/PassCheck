import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosError, type AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

/**
 * LeaksService — прокси к HaveIBeenPwned Range API.
 *
 * Реализует k-Anonymity модель:
 *   1. Клиент отправляет только первые 5 символов SHA-1 хэша пароля.
 *   2. Мы запрашиваем HIBP API и получаем список суффиксов хэшей.
 *   3. Клиент сам ищет свой суффикс в списке — сервер никогда не знает полный хэш.
 *
 * Кэш: Map<prefix, rawText> — живёт в памяти процесса.
 * При рестарте сервиса кэш сбрасывается (приемлемо для данного случая).
 */
@Injectable()
export class LeaksService {
  private readonly logger = new Logger(LeaksService.name);

  /** Простой in-memory кэш: ключ — prefix, значение — сырой текст от HIBP */
  private readonly cache = new Map<string, string>();

  private readonly HIBP_API_URL = 'https://api.pwnedpasswords.com/range';

  /** Axios-инстанс с retry-логикой и User-Agent */
  private readonly httpClient: AxiosInstance;

  constructor() {
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
   * Сначала проверяет кэш, при промахе — делает запрос к HIBP.
   *
   * ВАЖНО: prefix намеренно не логируется — это часть пользовательских данных.
   */
  async getHashSuffixes(prefix: string): Promise<string> {
    // ── Шаг 1: Проверяем кэш ──────────────────────────────────────────────
    if (this.cache.has(prefix)) {
      this.logger.debug('Cache HIT — возвращаем закэшированный результат');
      return this.cache.get(prefix)!;
    }

    // ── Шаг 2: Запрашиваем HIBP Range API ────────────────────────────────
    this.logger.debug('Cache MISS — обращаемся к HaveIBeenPwned API');

    try {
      const response = await this.httpClient.get<string>(`/${prefix}`);

      const data = response.data as string;

      // ── Шаг 3: Кэшируем результат ───────────────────────────────────────
      this.cache.set(prefix, data);
      this.logger.debug(
        `Закэшировано. Всего записей в кэше: ${this.cache.size}`,
      );

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
