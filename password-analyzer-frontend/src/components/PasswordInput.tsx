import { useState, useCallback } from 'react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Безопасное поле ввода пароля с переключателем видимости.
 *
 * Важные свойства безопасности:
 * - autoComplete="off" — не сохраняем в автозаполнении
 * - spellCheck=false — не отправляем текст в сервис проверки орфографии
 * - data-lpignore="true" — LastPass и подобные менеджеры игнорируют это поле
 */
export default function PasswordInput({
  value,
  onChange,
  disabled = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  return (
    <div className="relative input-glow rounded-xl transition-all duration-300">
      <input
        id="password-input"
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Введите пароль для анализа..."
        autoComplete="off"
        spellCheck={false}
        data-lpignore="true"
        className="
          w-full px-5 py-4 pr-14
          bg-surface-700/60 text-white text-lg
          border border-surface-500/50
          rounded-xl
          placeholder:text-gray-500
          focus:outline-none focus:border-accent-purple/60
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      />

      {/* Кнопка показать/скрыть пароль */}
      <button
        id="toggle-password-visibility"
        type="button"
        onClick={toggleVisibility}
        tabIndex={-1}
        className="
          absolute right-3 top-1/2 -translate-y-1/2
          p-2 rounded-lg
          text-gray-400 hover:text-accent-purple
          hover:bg-surface-500/40
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-accent-purple/40
        "
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/* ─── Inline SVG иконки ──────────────────────────────────── */

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.749 10.749 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
