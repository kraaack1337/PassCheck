export interface PasswordAnalysis {
  score: 0 | 1 | 2 | 3 | 4;
  entropy: number;
  crackTimeDisplay: string;
  crackTimeSeconds: number;
  feedback: {
    warning: string;
    suggestions: string[];
  };
  length: number;
}

export interface StrengthMeta {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  widthPercent: number;
}

export type LeakStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'safe' }
  | { state: 'leaked'; count: number }
  | { state: 'error'; message: string };
