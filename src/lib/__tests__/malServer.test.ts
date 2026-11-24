/**
 * @jest-environment node
 */
import { calledUrl, jsonResponse, mockFetch } from '../../test/utils';
import * as mal from '../malServer';

const ENV = { ...process.env };
beforeEach(() => {
  process.env = { ...ENV, MAL_CLIENT_ID: 'client-id-secreto' };
});
afterAll(() => {
  process.env = ENV;
});

const rawAnime = {
  id: 52991,
  title: 'Sousou no Frieren',
  main_picture: { medium: 'https://cdn.myanimelist.net/m.jpg', large: 'https://cdn.myanimelist.net/l.jpg' },
  alternative_titles: { en: 'Frieren: Beyond Journey’s End', ja: '葬送のフリーレン' },
  synopsis: 'Uma elfa maga... [Written by MAL Rewrite]',
  mean: 9.24,
  start_date: '2023-09-29',
  start_season: { year: 2023, season: 'fall' },
  genres: [{ id: 2, name: 'Adventure' }, { id: 10, name: 'Fantasy' }],
  status: 'finished_airing',
  num_list_users: 1000,
};

const list = (raw: unknown[], next = false) =>
  jsonResponse({ data: raw.map((node) => ({ node })), paging: next ? { next: 'https://api.myanimelist.net/v2/...' } : {} });

describe('requisições', () => {
  it('envia o Client ID no cabeçalho, nunca na URL', async () => {
    const fetch = mockFetch(list([]));
    await mal.topAnime();
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).not.toContain('client-id-secreto');
    expect(init.headers['X-MAL-CLIENT-ID']).toBe('client-id-secreto');
  });

  it('falha com mensagem clara quando o Client ID não está configurado', async () => {
    delete process.env.MAL_CLIENT_ID;
    await expect(mal.topAnime()).rejects.toMatchObject({ status: 500 });
  });

  it('expõe o status de erro do MAL (para tratar 404)', async () => {
    mockFetch(jsonResponse({ error: 'not_found' }, 404), jsonResponse({}, 404));
    await expect(mal.animeDetails(1)).rejects.toMatchObject({ status: 404 });
  });

  it('transforma falha de rede em 504', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed')) as unknown as typeof fetch;
    await expect(mal.topAnime()).rejects.toMatchObject({ status: 504 });
  });
});

describe('normalização', () => {
  it('prefere o título em inglês, limpa a sinopse e usa o pôster grande', () => {
    expect(mal.toItem(rawAnime)).toEqual({
      id: 52991,
      type: 'anime',
      title: 'Frieren: Beyond Journey’s End',
      poster: 'https://cdn.myanimelist.net/l.jpg',
      backdrop: null,
      year: '2023',
      rating: 9.24,
      overview: 'Uma elfa maga...',
    });
  });

  it('usa o título romanizado e o ano da data de estreia quando faltam dados', () => {
    expect(mal.toItem({ id: 1, title: 'Cowboy Bebop', start_date: '1998-04-03' })).toMatchObject({
      title: 'Cowboy Bebop',
      year: '1998',
      poster: null,
      rating: null,
    });
  });

  it('remove repetidos e conteúdo adulto', async () => {
    mockFetch(list([rawAnime, rawAnime, { id: 9, title: 'X', genres: [{ id: 12, name: 'Hentai' }] }]));
    expect((await mal.topAnime()).items.map((i) => i.id)).toEqual([52991]);
  });
});

describe('listas', () => {
  it('ranking paginado de 24 em 24', async () => {
    const fetch = mockFetch(list([rawAnime], true));
    const page = await mal.topAnime(3, 'bypopularity');
    expect(calledUrl(fetch).path).toBe('/v2/anime/ranking');
    expect(calledUrl(fetch).params).toMatchObject({ ranking_type: 'bypopularity', offset: '48', limit: '24' });
    expect(page).toMatchObject({ page: 3, hasMore: true });
  });

  it('busca exige pelo menos 3 letras (limite da API oficial)', async () => {
    const fetch = mockFetch(list([rawAnime]));
    expect(await mal.searchAnime('ab')).toEqual({ items: [], page: 1, hasMore: false });
    expect(fetch).not.toHaveBeenCalled();
    await mal.searchAnime('frieren', 2);
    expect(calledUrl(fetch).params).toMatchObject({ q: 'frieren', offset: '24' });
  });

  it('temporada atual mostra só as estreias quando há o bastante', async () => {
    const { year, season } = mal.currentSeason();
    const fresh = Array.from({ length: 30 }, (_, i) => ({ ...rawAnime, id: i + 1, start_season: { year, season } }));
    const old = { ...rawAnime, id: 999, start_season: { year: 1999, season: 'fall' } };
    const fetch = mockFetch(list([old, ...fresh]));
    const page = await mal.seasonNow();
    expect(calledUrl(fetch).path).toBe(`/v2/anime/season/${year}/${season}`);
    expect(page.items).toHaveLength(24);
    expect(page.items.some((i) => i.id === 999)).toBe(false);
    expect(page.hasMore).toBe(true);
  });

  it.each([
    ['popular', 'bypopularity'],
    ['top', 'all'],
    ['recent', 'airing'],
  ] as const)('ordenação "%s" usa o ranking "%s"', async (sort, type) => {
    const fetch = mockFetch(list([]));
    await mal.discoverAnime({ sort });
    expect(calledUrl(fetch).params.ranking_type).toBe(type);
  });

  it('filtra por gênero lendo o ranking em blocos', async () => {
    const other = { ...rawAnime, id: 2, genres: [{ id: 22, name: 'Romance' }] };
    const fetch = mockFetch(list([rawAnime, other], true), list([other], true), list([{ ...rawAnime, id: 3 }], true));
    const page = await mal.discoverAnime({ genre: 10 });
    expect(calledUrl(fetch, 0).params).toMatchObject({ offset: '0', limit: '500' });
    expect(calledUrl(fetch, 1).params.offset).toBe('500');
    expect(page.items.map((i) => i.id)).toEqual([52991, 3]);
    // A próxima página continua do último bloco lido.
    expect(page).toMatchObject({ page: 3, hasMore: true });
  });

  it('filtra por ano juntando as quatro temporadas', async () => {
    const a = { ...rawAnime, id: 1, num_list_users: 10 };
    const b = { ...rawAnime, id: 2, num_list_users: 50 };
    const fetch = mockFetch(list([a]), list([b]), list([]), list([{ ...rawAnime, id: 3, start_season: { year: 2022, season: 'fall' } }]));
    const page = await mal.discoverAnime({ year: 2023 });
    expect([0, 1, 2, 3].map((i) => calledUrl(fetch, i).path)).toEqual([
      '/v2/anime/season/2023/winter',
      '/v2/anime/season/2023/spring',
      '/v2/anime/season/2023/summer',
      '/v2/anime/season/2023/fall',
    ]);
    expect(page.items.map((i) => i.id)).toEqual([2, 1]);
  });
});

describe('detalhes', () => {
  const full = {
    ...rawAnime,
    rank: 1,
    num_episodes: 28,
    average_episode_duration: 1470,
    studios: [{ id: 11, name: 'Madhouse' }],
    recommendations: [{ node: { ...rawAnime, id: 33352, title: 'Violet Evergarden', alternative_titles: { en: '' } } }],
  };

  it('traduz a ficha técnica', async () => {
    mockFetch(jsonResponse(full), jsonResponse({}, 503));
    const d = await mal.animeDetails(52991);
    expect(d.originalTitle).toBe('Sousou no Frieren');
    expect(d.genres).toEqual(['Adventure', 'Fantasy']);
    expect(d.facts).toEqual(
      expect.arrayContaining([
        { label: 'Temporada', value: 'Outono 2023' },
        { label: 'Episódios', value: '28' },
        { label: 'Duração', value: '25 min por ep.' },
        { label: 'Estúdio', value: 'Madhouse' },
        { label: 'Status', value: 'Finalizado' },
        { label: 'Ranking', value: '#1' },
      ]),
    );
    expect(d.externalUrl).toBe('https://myanimelist.net/anime/52991');
    expect(d.trailerKey).toBeNull();
  });

  it('completa trailer e onde assistir com a Jikan quando ela responde', async () => {
    mockFetch(
      jsonResponse(full),
      jsonResponse({
        data: {
          trailer: { youtube_id: null, embed_url: 'https://www.youtube.com/embed/qgQhrq2ruGg?x=1', images: {} },
          streaming: [{ name: 'Crunchyroll', url: 'https://crunchyroll.com/frieren' }],
        },
      }),
    );
    const d = await mal.animeDetails(52991);
    expect(d.trailerKey).toBe('qgQhrq2ruGg');
    expect(d.providers).toEqual([{ name: 'Crunchyroll', logo: null, url: 'https://crunchyroll.com/frieren' }]);
  });

  it('recomendações vêm do próprio MAL', async () => {
    mockFetch(jsonResponse(full));
    const recs = await mal.animeRecommendations(52991);
    expect(recs).toEqual([expect.objectContaining({ id: 33352, title: 'Violet Evergarden', type: 'anime' })]);
  });

  it('personagens: principais primeiro, com o dublador japonês', async () => {
    mockFetch(
      jsonResponse({
        data: [
          { role: 'Supporting', favorites: 999, character: { mal_id: 3, name: 'Coadjuvante', images: { jpg: { image_url: 'c.jpg' } } }, voice_actors: [] },
          {
            role: 'Main',
            favorites: 10,
            character: { mal_id: 1, name: 'Frieren', images: { webp: { image_url: 'f.webp' } } },
            voice_actors: [
              { language: 'English', person: { name: 'Mallorie Rodak' } },
              { language: 'Japanese', person: { name: 'Atsumi Tanezaki' } },
            ],
          },
        ],
      }),
    );
    expect(await mal.animeCast(52991)).toEqual([
      { id: 1, name: 'Frieren', role: 'Voz: Atsumi Tanezaki', photo: 'f.webp' },
      { id: 3, name: 'Coadjuvante', role: 'Coadjuvante', photo: 'c.jpg' },
    ]);
  });

  it('personagens ficam vazios se a Jikan estiver fora do ar', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('timeout')) as unknown as typeof fetch;
    expect(await mal.animeCast(52991)).toEqual([]);
  });
});
