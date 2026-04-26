import { useState, useCallback, useRef, useEffect } from 'react';
import type { PasswordAnalysis, LeakStatus } from './types';
import { analyzePassword } from './utils/passwordAnalyzer';
import { checkLeaks } from './utils/leakChecker';
import PasswordInput from './components/PasswordInput';
import StrengthMeter from './components/StrengthMeter';
import AnalysisResults from './components/AnalysisResults';
import PasswordGenerator from './components/PasswordGenerator';

/**
 * App — главная страница Password Analyzer.
 *
 * Пайплайн:
 * 1. Ввод пароля → мгновенный анализ через zxcvbn (локально)
 * 2. Debounce 600ms → SHA-1 хэш → k-Anonymity проверка утечек через бэкенд
 * 3. Отображение результатов: шкала силы, энтропия, время взлома, статус утечек
 *
 * Пароль НИКОГДА не покидает браузер в исходном виде.
 */
export default function App() {
  const [password, setPassword] = useState('');
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null);
  const [leakStatus, setLeakStatus] = useState<LeakStatus>({ state: 'idle' });

  // Ref для debounce таймера проверки утечек
  const leakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (leakTimerRef.current) clearTimeout(leakTimerRef.current);
    };
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);

    // Очищаем предыдущий таймер проверки утечек
    if (leakTimerRef.current) {
      clearTimeout(leakTimerRef.current);
      leakTimerRef.current = null;
    }

    if (!value) {
      setAnalysis(null);
      setLeakStatus({ state: 'idle' });
      return;
    }

    // ── Шаг 1: Мгновенный локальный анализ ──────────────────
    const result = analyzePassword(value);
    setAnalysis(result);

    // ── Шаг 2: Debounced проверка утечек (600ms) ─────────────
    setLeakStatus({ state: 'idle' });
    leakTimerRef.current = setTimeout(async () => {
      setLeakStatus({ state: 'checking' });
      const status = await checkLeaks(value);
      setLeakStatus(status);
    }, 600);
  }, []);

  const handleUseGenerated = useCallback(
    (generatedPassword: string) => {
      handlePasswordChange(generatedPassword);
    },
    [handlePasswordChange],
  );

  return (
    <div className="bg-gradient-animated min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* ─── Header ──────────────────────────────────────────── */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-xl">
              🔒
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-white">Password</span>{' '}
              <span className="text-accent-purple">Analyzer</span>
            </h1>
          </div>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            Проверь надёжность пароля. Анализ происходит{' '}
            <span className="text-gray-300 font-medium">
              локально в твоём браузере
            </span>{' '}
            — пароль никуда не отправляется.
          </p>
        </header>

        {/* ─── Main Card ───────────────────────────────────────── */}
        <main className="glass-card p-6 sm:p-8 space-y-6">
          {/* Поле ввода */}
          <PasswordInput
            value={password}
            onChange={handlePasswordChange}
          />

          {/* Шкала силы */}
          <StrengthMeter analysis={analysis} />

          {/* Результаты анализа */}
          <AnalysisResults analysis={analysis} leakStatus={leakStatus} />

          {/* Генератор паролей */}
          <PasswordGenerator onUsePassword={handleUseGenerated} />
        </main>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <footer className="mt-6 text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            Утечки проверяются через{' '}
            <a
              href="https://haveibeenpwned.com/API/v3#PwnedPasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-purple/60 hover:text-accent-purple transition-colors"
            >
              HaveIBeenPwned
            </a>{' '}
            по протоколу{' '}
            <span className="text-gray-500 font-medium">k-Anonymity</span>.
            Только 5 символов SHA-1 хэша покидают браузер.
          </p>
        </footer>
      </div>
    </div>
  );
}
