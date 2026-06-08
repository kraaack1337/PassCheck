import { describe, it, expect } from 'vitest';
import { analyzePassword } from './passwordAnalyzer';

describe('passwordAnalyzer', () => {
  it('should evaluate a weak password correctly', () => {
    const analysis = analyzePassword('123456');
    expect(analysis.score).toBe(0);
    expect(analysis.length).toBe(6);
  });

  it('should evaluate a strong password correctly', () => {
    const analysis = analyzePassword('CorrectHorseBatteryStaple123!');
    expect(analysis.score).toBeGreaterThanOrEqual(3);
    expect(analysis.length).toBe(29);
  });
});
