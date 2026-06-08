import { useState, useCallback } from 'react';

const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export function usePasswordGenerator() {
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
    return password;
  }, [length, useUppercase, useDigits, useSpecial]);

  return {
    length,
    setLength,
    useUppercase,
    setUseUppercase,
    useDigits,
    setUseDigits,
    useSpecial,
    setUseSpecial,
    generated,
    setGenerated,
    generate,
  };
}
