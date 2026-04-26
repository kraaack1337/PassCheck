import type { PasswordAnalysis } from '../types';
import type { LeakStatus } from '../types';
import { getStrengthMeta } from '../utils/passwordAnalyzer';

interface AnalysisResultsProps {
  analysis: PasswordAnalysis | null;
  leakStatus: LeakStatus;
}

/**
 * Блок результатов анализа — энтропия, время взлома, обратная связь, статус утечек.
 */
export default function AnalysisResults({
  analysis,
  leakStatus,
}: AnalysisResultsProps) {
  if (!analysis) return null;

  const meta = getStrengthMeta(analysis.score);

  return (
    <div
      id="analysis-results"
      className="space-y-4 animate-fade-in-up"
    >
      {/* ─── Карточки метрик ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          id="metric-entropy"
          label="Энтропия"
          value={`${analysis.entropy} бит`}
          icon="🔐"
        />
        <MetricCard
          id="metric-crack-time"
          label="Время взлома"
          value={analysis.crackTimeDisplay}
          icon="⏱️"
        />
      </div>

      {/* ─── Обратная связь zxcvbn ───────────────────────────── */}
      {(analysis.feedback.warning || analysis.feedback.suggestions.length > 0) && (
        <div className="p-4 rounded-xl bg-surface-700/40 border border-surface-500/30 space-y-2">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span>💡</span> Рекомендации
          </h3>

          {analysis.feedback.warning && (
            <p className="text-sm text-amber-400/90">
              ⚠️ {analysis.feedback.warning}
            </p>
          )}

          {analysis.feedback.suggestions.length > 0 && (
            <ul className="space-y-1">
              {analysis.feedback.suggestions.map((suggestion, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-400 flex items-start gap-2"
                >
                  <span className="text-accent-purple mt-0.5 text-xs">▸</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ─── Статус утечек ───────────────────────────────────── */}
      <LeakStatusBadge status={leakStatus} />

      {/* ─── Оценка силы (мини-бейдж) ────────────────────────── */}
      <div className="flex items-center justify-center">
        <div
          className="px-4 py-2 rounded-full text-sm font-bold tracking-wider border"
          style={{
            color: meta.color,
            borderColor: `${meta.color}40`,
            backgroundColor: `${meta.color}10`,
          }}
        >
          SCORE: {analysis.score} / 4
        </div>
      </div>
    </div>
  );
}

/* ─── Карточка метрики ───────────────────────────────────── */

function MetricCard({
  id,
  label,
  value,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div
      id={id}
      className="
        p-4 rounded-xl
        bg-surface-700/40 border border-surface-500/30
        transition-all duration-300
        hover:border-accent-purple/30 hover:bg-surface-700/60
      "
    >
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-white font-semibold text-sm">{value}</div>
    </div>
  );
}

/* ─── Бейдж статуса утечек ───────────────────────────────── */

function LeakStatusBadge({ status }: { status: LeakStatus }) {
  if (status.state === 'idle') return null;

  const config: Record<
    Exclude<LeakStatus['state'], 'idle'>,
    { icon: string; text: string; colorClass: string; dotColor: string }
  > = {
    checking: {
      icon: '🔍',
      text: 'Проверка по базе утечек...',
      colorClass: 'text-gray-400',
      dotColor: '#a78bfa',
    },
    safe: {
      icon: '✅',
      text: 'Пароль НЕ найден в базе утечек',
      colorClass: 'text-emerald-400',
      dotColor: '#34d399',
    },
    leaked: {
      icon: '🚨',
      text: `Найден в утечках ${status.state === 'leaked' ? status.count.toLocaleString('ru-RU') : ''} раз!`,
      colorClass: 'text-red-400',
      dotColor: '#f87171',
    },
    error: {
      icon: '⚠️',
      text: status.state === 'error' ? status.message : '',
      colorClass: 'text-amber-400',
      dotColor: '#fbbf24',
    },
  };

  const c = config[status.state as Exclude<LeakStatus['state'], 'idle'>];

  return (
    <div
      id="leak-status"
      className={`
        flex items-center gap-3 p-4 rounded-xl
        bg-surface-700/40 border border-surface-500/30
        ${c.colorClass}
      `}
    >
      {status.state === 'checking' ? (
        <span
          className="w-2.5 h-2.5 rounded-full pulse-dot"
          style={{ backgroundColor: c.dotColor }}
        />
      ) : (
        <span className="text-base">{c.icon}</span>
      )}
      <span className="text-sm font-medium">{c.text}</span>
    </div>
  );
}
