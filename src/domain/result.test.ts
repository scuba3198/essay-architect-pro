import { describe, it, expect } from 'vitest';
import { ok, err, type Result } from './result';

describe('Result', () => {
  it('should create an Ok result', () => {
    const result: Result<number, string> = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('should create an Err result', () => {
    const result: Result<number, string> = err('Something went wrong');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Something went wrong');
    }
  });
});
