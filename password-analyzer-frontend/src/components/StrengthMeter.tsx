import type { PasswordAnalysis } from '../types';
import { getStrengthMeta } from '../utils/passwordAnalyzer';

interface StrengthMeterProps {
  analysis: PasswordAnalysis | null;
}

/**
 * Визуальный индикатор силы пароля — «светофор».
 *
 * 5 сегментов, каждый подсвечивается цветом в зависимости от score:
 *   0 — красный (10%)  «Очень слабый»
 *   1 — оранжевый (30%) «Слабый»
 *   2 — жёлтый (55%)    «Средний»
 *   3 — зелёный (80%)   «Хороший»
 *   4 — циан (100%)     «Отличный»
 */
export default function StrengthMeter({ analysis }: StrengthMeterProps) {
  const meta = analysis ? getStrengthMeta(analysis.score) : null;

  return (
    <div id="strength-meter" className="space-y-3">
      {/* Шкала из 5 сегментов */}
      <div className="flex gap-1.5">
        {([0, 1, 2, 3, 4] as const).map((segmentIndex) => (
          <div
            key={segmentIndex}
            className="h-2 flex-1 rounded-full transition-all duration-500 ease-out"
            style={{
              backgroundColor:
                analysis && segmentIndex <= analysis.score
                  ? meta!.color
                  : 'rgba(50, 50, 74, 0.6)',
              boxShadow:
                analysis && segmentIndex <= analysis.score
                  ? `0 0 8px ${meta!.color}40`
                  : 'none',
            }}
          />
        ))}
      </div>

      {/* Лейбл силы */}
      {analysis && meta && (
        <div className="flex items-center justify-between animate-fade-in-up">
          <span
            className="text-sm font-semibold tracking-wide"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="text-xs text-gray-500">
            {analysis.length} символов
          </span>
        </div>
      )}
    </div>
  );
}
