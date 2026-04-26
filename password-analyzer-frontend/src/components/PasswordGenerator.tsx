import { useState, useCallback } from 'react';

interface PasswordGeneratorProps {
  onUsePassword: (password: string) => void;
}

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Генератор стойких паролей с настройками.
 * Использует crypto.getRandomValues() для криптографически стойкой случайности.
 */
export default function PasswordGenerator({
  onUsePassword,
}: PasswordGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [length, setLength] = useState(20);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useDigits, setUseDigits] = useState(true);
  const [useSpecial, setUseSpecial] = useState(true);
  const [generated, setGenerated] = useState('');

  const generate = useCallback(() => {
    let charset = CHAR_SETS.lowercase;
    if (useUppercase) charset += CHAR_SETS.uppercase;
    if (useDigits) charset += CHAR_SETS.digits;
    if (useSpecial) charset += CHAR_SETS.special;

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    const password = Array.from(array)
      .map((n) => charset[n % charset.length])
      .join('');

    setGenerated(password);
  }, [length, useUppercase, useDigits, useSpecial]);

  const handleUse = useCallback(() => {
    if (generated) {
      onUsePassword(generated);
    }
  }, [generated, onUsePassword]);

  return (
    <div className="mt-4">
      <button
        id="toggle-generator"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !generated) {
            // Генерируем сразу при открытии
            let charset = CHAR_SETS.lowercase;
            if (useUppercase) charset += CHAR_SETS.uppercase;
            if (useDigits) charset += CHAR_SETS.digits;
            if (useSpecial) charset += CHAR_SETS.special;
            const array = new Uint32Array(length);
            crypto.getRandomValues(array);
            setGenerated(
              Array.from(array)
                .map((n) => charset[n % charset.length])
                .join(''),
            );
          }
        }}
        className="
          flex items-center gap-2 text-sm
          text-accent-purple hover:text-accent-cyan
          transition-colors duration-200
          focus:outline-none
        "
      >
        <span className="text-base">🎲</span>
        {isOpen ? 'Скрыть генератор' : 'Сгенерировать стойкий пароль'}
      </button>

      {isOpen && (
        <div className="mt-3 p-4 rounded-xl bg-surface-700/40 border border-surface-500/30 space-y-4 animate-fade-in-up">
          {/* Длина */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider">
                Длина
              </label>
              <span className="text-sm font-semibold text-accent-cyan">
                {length}
              </span>
            </div>
            <input
              id="generator-length-slider"
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-accent-purple"
            />
          </div>

          {/* Чекбоксы */}
          <div className="flex flex-wrap gap-3">
            <CheckboxOption
              id="gen-uppercase"
              label="A-Z"
              checked={useUppercase}
              onChange={setUseUppercase}
            />
            <CheckboxOption
              id="gen-digits"
              label="0-9"
              checked={useDigits}
              onChange={setUseDigits}
            />
            <CheckboxOption
              id="gen-special"
              label="!@#$"
              checked={useSpecial}
              onChange={setUseSpecial}
            />
          </div>

          {/* Сгенерированный пароль */}
          {generated && (
            <div className="p-3 rounded-lg bg-surface-800/80 border border-surface-500/30">
              <code
                id="generated-password"
                className="text-sm text-accent-cyan break-all font-mono"
              >
                {generated}
              </code>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-2">
            <button
              id="btn-regenerate"
              type="button"
              onClick={generate}
              className="
                flex-1 py-2.5 px-4 rounded-xl
                bg-surface-600/60 text-gray-300
                hover:bg-surface-500/60 hover:text-white
                border border-surface-500/30
                text-sm font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-accent-purple/40
              "
            >
              🔄 Ещё
            </button>
            <button
              id="btn-use-generated"
              type="button"
              onClick={handleUse}
              disabled={!generated}
              className="
                flex-1 py-2.5 px-4 rounded-xl
                bg-accent-purple/20 text-accent-purple
                hover:bg-accent-purple/30
                border border-accent-purple/30
                text-sm font-semibold
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-accent-purple/40
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              Использовать ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Чекбокс-опция ──────────────────────────────────────── */

function CheckboxOption({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        text-sm cursor-pointer transition-all duration-200
        border
        ${
          checked
            ? 'bg-accent-purple/15 border-accent-purple/30 text-accent-purple'
            : 'bg-surface-700/40 border-surface-500/30 text-gray-500 hover:text-gray-300'
        }
      `}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`
          w-3.5 h-3.5 rounded border-2 flex items-center justify-center
          transition-all duration-200
          ${
            checked
              ? 'bg-accent-purple border-accent-purple'
              : 'border-gray-600'
          }
        `}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5L4.5 7.5L8 3"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {label}
    </label>
  );
}
