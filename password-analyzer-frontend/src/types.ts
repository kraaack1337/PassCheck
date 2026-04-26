/**
 * Результат анализа пароля — выходные данные zxcvbn + наши расчёты.
 */
export interface PasswordAnalysis {
  /** Оценка zxcvbn: 0 (мусор) — 4 (отлично) */
  score: 0 | 1 | 2 | 3 | 4;
  /** Энтропия в битах (log2 от количества вариантов) */
  entropy: number;
  /** Время взлома (offline, 10B/s) — текстовая строка */
  crackTimeDisplay: string;
  /** Время взлома в секундах */
  crackTimeSeconds: number;
  /** Текстовая оценка: «мгновенно», «часы», «века» и т.п. */
  feedback: {
    warning: string;
    suggestions: string[];
  };
  /** Длина пароля */
  length: number;
}

/**
 * Мета-информация о уровне силы пароля — цвет, лейбл, ширина.
 */
export interface StrengthMeta {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  widthPercent: number;
}

/**
 * Статус проверки утечек через HIBP.
 */
export type LeakStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'safe' }
  | { state: 'leaked'; count: number }
  | { state: 'error'; message: string };
