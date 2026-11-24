import { calledUrl, jsonResponse, mockFetch } from '../../test/utils';
import * as anime from '../anime';

const page = { items: [], page: 1, hasMore: false };

it('passa tudo pela rota /api/anime (o Client ID nunca vai para o navegador)', async () => {
  const fetch = mockFetch(...Array.from({ length: 7 }, () => jsonResponse(page)));
  await anime.getSeasonNow(2);
  await anime.getTopAnime(1, 'bypopularity');
  await anime.discoverAnime({ genre: 10, sort: 'top', year: 2023 });
  await anime.searchAnime('frieren', 3);
  await anime.getAnimeDetails(52991);
  await anime.getAnimeRecommendations(52991);
  await anime.getAnimeCast(52991);

  expect(fetch.mock.calls.map((_, i) => calledUrl(fetch, i).path)).toEqual([
    '/api/anime/season',
    '/api/anime/top',
    '/api/anime/discover',
    '/api/anime/search',
    '/api/anime/52991',
    '/api/anime/52991/recommendations',
    '/api/anime/52991/characters',
  ]);
  expect(calledUrl(fetch, 0).params).toEqual({ page: '2' });
  expect(calledUrl(fetch, 1).params).toEqual({ page: '1', filter: 'bypopularity' });
  expect(calledUrl(fetch, 2).params).toEqual({ page: '1', genre: '10', sort: 'top', year: '2023' });
  expect(calledUrl(fetch, 3).params).toEqual({ q: 'frieren', page: '3' });
});

it('omite parâmetros vazios', async () => {
  const fetch = mockFetch(jsonResponse(page));
  await anime.discoverAnime({});
  expect(calledUrl(fetch).params).toEqual({ page: '1' });
});

it('mostra a mensagem de erro do servidor', async () => {
  mockFetch(jsonResponse({ error: 'Falha ao consultar o MyAnimeList' }, 502));
  await expect(anime.getSeasonNow()).rejects.toThrow('Falha ao consultar o MyAnimeList');
});

it('transforma falhas de rede em mensagem amigável', async () => {
  global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;
  await expect(anime.getSeasonNow()).rejects.toThrow('não respondeu');
});

it('respeita o cancelamento de quem chamou', async () => {
  global.fetch = jest.fn(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))),
  ) as unknown as typeof fetch;
  const controller = new AbortController();
  const promise = anime.searchAnime('naruto', 1, controller.signal);
  controller.abort();
  await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
});
