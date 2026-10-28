import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url: string, _key: string, options: unknown) => options,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('reads the visitor ID for each request, including after first-visit initialization', async () => {
  let visitorId: string | null = null;
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', { getItem: () => visitorId });
  const fetchMock = vi.fn().mockResolvedValue(new Response());
  vi.stubGlobal('fetch', fetchMock);
  const { supabase } = await import('./supabase');
  const client = supabase as unknown as { global: { fetch: typeof fetch } };

  visitorId = 'first-visitor';
  await client.global.fetch('https://example.invalid', {
    headers: { Authorization: 'Bearer test' },
  });
  expect(fetchMock.mock.calls[0]?.[1].headers.get('x-visitor-id')).toBe('first-visitor');
  expect(fetchMock.mock.calls[0]?.[1].headers.get('Authorization')).toBe('Bearer test');

  visitorId = 'changed-visitor';
  await client.global.fetch('https://example.invalid');
  expect(fetchMock.mock.calls[1]?.[1].headers.get('x-visitor-id')).toBe('changed-visitor');
});
