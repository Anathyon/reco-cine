/**
 * @jest-environment node
 */
import { calledUrl, jsonResponse, mockFetch } from '../../test/utils';
import * as manga from '../mangaServer';

const ENV = { ...process.env };
beforeEach(() => {
  process.env = { ...ENV, MAL_CLIENT_ID: 'client-id-secreto' };
});
afterAll(() => {
  process.env = ENV;
});

const rawManga = {
  id: 2,
  title: 'Berserk',
  main_picture: { medium: 'https://cdn.myanimelist.net/m.jpg', large: 'https://cdn.myanimelist.net/l.jpg' },
  alternative_titles: { en: 'Berserk', ja: 'ベルセルク' },
  synopsis: 'Guts, um mercenário... [Written by MAL Rewrite]',
  mean: 9.46,
  start_date: '1989-08-25',
  genres: [{ id: 1, name: 'Action' }, { id: 41, name: 'Seinen' }, { id: 84, name: 'Eligible Titles for You Should Read This' }],
  status: 'currently_publishing',
  media_type: 'manga',
};
const adult = { ...rawManga, id: 9, title: 'Proibido', genres: [{ id: 12, name: 'Hentai' }] };

const list = (raw: unknown[], next = false) =>
  jsonResponse({ data: raw.map((node) => ({ node })), paging: next ? { next: 'https://api.myanimelist.net/v2/...' } : {} });

it('normaliza para o formato da interface', () => {
  expect(manga.toMangaItem(rawManga)).toEqual({
    id: 2,
    type: 'manga',
    title: 'Berserk',
    poster: 'https://cdn.myanimelist.net/l.jpg',
    backdrop: null,
    year: '1989',
    rating: 9.46,
    overview: 'Guts, um mercenário...',
  });
});

it('catálogo usa o ranking do MAL e nunca mostra +18', async () => {
  const fetch = mockFetch(list([rawManga, adult], true));
  const page = await manga.discoverManga({ sort: 'top', page: 2 });
  expect(calledUrl(fetch).path).toBe('/v2/manga/ranking');
  expect(calledUrl(fetch).params).toMatchObject({ ranking_type: 'all', offset: '24', limit: '24' });
  expect(page.items.map((i) => i.id)).toEqual([2]);
  expect(page.hasMore).toBe(true);
});

it('filtra por gênero lendo o ranking em blocos', async () => {
  const other = { ...rawManga, id: 3, genres: [{ id: 22, name: 'Romance' }] };
  const fetch = mockFetch(list([rawManga, other], false));
  const page = await manga.discoverManga({ genre: 41 });
  expect(calledUrl(fetch).params).toMatchObject({ ranking_type: 'bypopularity', limit: '500' });
  expect(page.items.map((i) => i.id)).toEqual([2]);
  expect(page.hasMore).toBe(false);
});

it('busca comum sem +18; busca +18 só quando pedida', async () => {
  const fetch = mockFetch(list([rawManga, adult]), list([rawManga, adult]));
  expect((await manga.searchManga('berserk')).items.map((i) => i.id)).toEqual([2]);
  expect(calledUrl(fetch, 0).params.nsfw).toBeUndefined();
  expect((await manga.searchManga('berserk', 1, { adult: true })).items.map((i) => i.id)).toEqual([2, 9]);
  expect(calledUrl(fetch, 1).params.nsfw).toBe('true');
});

it('detalhes em português, sem temas internos do MAL', () => {
  const d = manga.normalizeMangaDetails(2, {
    ...rawManga,
    rank: 1,
    num_volumes: 42,
    num_chapters: 0,
    authors: [{ node: { first_name: 'Kentarou', last_name: 'Miura' }, role: 'Story & Art' }],
    serialization: [{ node: { name: 'Young Animal' } }],
  });
  expect(d.genres).toEqual(['Ação', 'Seinen']);
  expect(d.facts).toEqual([
    { label: 'Formato', value: 'Mangá' },
    { label: 'Lançamento', value: expect.any(String) },
    { label: 'Volumes', value: '42' },
    { label: 'Autoria', value: 'Kentarou Miura' },
    { label: 'Revista', value: 'Young Animal' },
    { label: 'Status', value: 'Em publicação' },
    { label: 'Ranking', value: '#1' },
  ]);
  expect(d.originalTitle).toBe('ベルセルク');
  expect(d.externalUrl).toBe('https://myanimelist.net/manga/2');
});
