import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommon from '@zxcvbn-ts/language-common';
import * as zxcvbnEn from '@zxcvbn-ts/language-en';
import type { PasswordAnalysis, StrengthMeta } from '../types';

/* ─── Инициализация словарей zxcvbn ──────────────────────── */
const options = {
  dictionary: {
    ...zxcvbnCommon.dictionary,
    ...zxcvbnEn.dictionary,
  },
  graphs: zxcvbnCommon.adjacencyGraphs,
  translations: zxcvbnEn.translations,
};

zxcvbnOptions.setOptions(options);

/* ─── Анализ пароля ──────────────────────────────────────── */

/**
 * Анализирует пароль через zxcvbn-ts и возвращает структурированный результат.
 * Всё происходит локально — пароль НЕ покидает браузер.
 */
export function analyzePassword(password: string): PasswordAnalysis {
  const result = zxcvbn(password);

  // Расчёт энтропии: log2(guesses)
  // guesses — количество попыток, необходимых для угадывания пароля
  const entropy = Math.log2(result.guesses);

  return {
    score: result.score as PasswordAnalysis['score'],
    entropy: Math.round(entropy * 10) / 10,
    crackTimeDisplay:
      result.crackTimesDisplay.offlineSlowHashing1e4PerSecond,
    crackTimeSeconds:
      result.crackTimesSeconds.offlineSlowHashing1e4PerSecond,
    feedback: {
      warning: result.feedback.warning ?? '',
      suggestions: result.feedback.suggestions ?? [],
    },
    length: password.length,
  };
}

/* ─── Мета-данные «светофора» ────────────────────────────── */

const STRENGTH_META: Record<PasswordAnalysis['score'], StrengthMeta> = {
  0: {
    label: 'Очень слабый',
    color: '#ef4444',
    bgClass: 'bg-strength-0',
    textClass: 'text-strength-0',
    widthPercent: 10,
  },
  1: {
    label: 'Слабый',
    color: '#f97316',
    bgClass: 'bg-strength-1',
    textClass: 'text-strength-1',
    widthPercent: 30,
  },
  2: {
    label: 'Средний',
    color: '#eab308',
    bgClass: 'bg-strength-2',
    textClass: 'text-strength-2',
    widthPercent: 55,
  },
  3: {
    label: 'Хороший',
    color: '#22c55e',
    bgClass: 'bg-strength-3',
    textClass: 'text-strength-3',
    widthPercent: 80,
  },
  4: {
    label: 'Отличный',
    color: '#06d6a0',
    bgClass: 'bg-strength-4',
    textClass: 'text-strength-4',
    widthPercent: 100,
  },
};

export function getStrengthMeta(score: PasswordAnalysis['score']): StrengthMeta {
  return STRENGTH_META[score];
}
