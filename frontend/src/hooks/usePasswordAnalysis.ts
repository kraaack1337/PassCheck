import { useState, useCallback, useRef, useEffect } from 'react';
import type { LeakStatus, PasswordAnalysis } from '@passcheck/shared';
import { analyzePassword } from '../utils/passwordAnalyzer';
import { checkLeaks } from '../services/leakChecker';

export function usePasswordAnalysis() {
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

  return {
    password,
    analysis,
    leakStatus,
    handlePasswordChange,
  };
}
