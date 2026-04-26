import type { LeakStatus } from '../types';

/**
 * Хеширует пароль через SHA-1 (Web Crypto API), делит на prefix/suffix,
 * отправляет prefix на бэкенд и ищет suffix в ответе.
 *
 * Протокол k-Anonymity:
 *   1. SHA-1 хэш пароля (40 hex символов)
 *   2. Prefix = первые 5 символов → отправляется на сервер
 *   3. Suffix = оставшиеся 35 символов → никуда не отправляется
 *   4. Сервер возвращает список suffix:count — ищем наш suffix
 *
 * Сервер никогда не знает полный хэш. Атакующий, перехвативший трафик,
 * видит только prefix — это ~1 миллион возможных паролей, бесполезно.
 */
export async function checkLeaks(password: string): Promise<LeakStatus> {
  try {
    // ── Шаг 1: SHA-1 хеш пароля ─────────────────────────────
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);

    // Преобразуем ArrayBuffer → hex-строку (uppercase)
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    // ── Шаг 2: Разделение на prefix и suffix ─────────────────
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // ── Шаг 3: Запрос к нашему бэкенду ──────────────────────
    const response = await fetch(`/api/v1/leaks/${prefix}`);

    if (!response.ok) {
      return {
        state: 'error',
        message: `Сервер ответил: ${response.status}`,
      };
    }

    const text = await response.text();

    // ── Шаг 4: Поиск нашего suffix в ответе ──────────────────
    // Формат HIBP: SUFFIX:COUNT\r\n
    const lines = text.split('\r\n');
    for (const line of lines) {
      const [lineSuffix, countStr] = line.split(':');
      if (lineSuffix === suffix) {
        return {
          state: 'leaked',
          count: parseInt(countStr, 10),
        };
      }
    }

    return { state: 'safe' };
  } catch (err: any) {
    // Проверка на ошибку Secure Context
    if (!crypto || !crypto.subtle) {
      return {
        state: 'error',
        message: 'Ошибка безопасности: браузер заблокировал криптографию (crypto.subtle). Для работы через IP-адрес или домен требуется HTTPS соединение.',
      };
    }
    
    return {
      state: 'error',
      message: `Ошибка соединения: ${err.message || String(err)}`,
    };
  }
}
