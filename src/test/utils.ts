import type { MediaItem } from '../types';

/** Resposta mínima compatível com o que o código usa de `fetch`. */
export function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

export function mockFetch(...responses: Response[]) {
  const fn = jest.fn();
  for (const r of responses) fn.mockResolvedValueOnce(r);
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

/** Converte a URL chamada em { path, params } para facilitar asserções. */
export function calledUrl(fn: jest.Mock, call = 0) {
  const url = new URL(String(fn.mock.calls[call][0]), 'http://localhost');
  return { path: url.pathname, params: Object.fromEntries(url.searchParams) };
}

export function makeItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: 550,
    type: 'movie',
    title: 'Clube da Luta',
    poster: 'https://image.tmdb.org/t/p/w342/poster.jpg',
    backdrop: null,
    year: '1999',
    rating: 8.4,
    overview: 'Um homem insone...',
    ...overrides,
  };
}

export interface MockRouter {
  pathname: string;
  query: Record<string, string | string[] | undefined>;
  isReady: boolean;
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
}

export function makeRouter(overrides: Partial<MockRouter> = {}): MockRouter {
  return {
    pathname: '/',
    query: {},
    isReady: true,
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    ...overrides,
  };
}
