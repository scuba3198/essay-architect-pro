/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { Effect } from 'effect';
import { generateSecureToken } from './crypto-utils';

describe('crypto-utils', () => {
  it('should generate a secure token of correct length', async () => {
    // Mock crypto.getRandomValues
    const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
      return arr;
    });

    vi.stubGlobal('crypto', {
      getRandomValues: mockGetRandomValues,
    });
    // Also stub window.crypto just in case but vitest-environment jsdom should handle window
    if (typeof window !== 'undefined') {
      vi.stubGlobal('window', {
        ...window,
        crypto: {
          getRandomValues: mockGetRandomValues,
        },
      });
    }

    const program = generateSecureToken(16);
    const result = await Effect.runPromise(program);

    expect(result).toHaveLength(32); // 16 bytes = 32 hex chars
    expect(mockGetRandomValues).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('should fail if crypto is not available', async () => {
    vi.stubGlobal('crypto', undefined);
    if (typeof window !== 'undefined') {
      vi.stubGlobal('window', {
        ...window,
        crypto: undefined,
      });
    }

    const program = generateSecureToken(16);
    const exit = await Effect.runPromiseExit(program);

    expect(exit._tag).toBe('Failure');

    vi.unstubAllGlobals();
  });
});
