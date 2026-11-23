import { calledUrl, jsonResponse, mockFetch } from '../../test/utils';

type Jikan = typeof import('../jikan');

// A fila de requisições guarda estado no módulo: cada teste recebe uma cópia nova.
let jikan: Jikan;
beforeEach(async () => {
  jest.useFakeTimers();
  jest.resetModules();
  jikan = await import('../jikan');
});
afterEach(() => jest.useRealTimers());

/** Executa uma chamada avançando os timers da fila/retentativas. */
async function run<T>(promise: Promise<T>): Promise<T> {
  const settled = promise.then(
    (value) => ({ value }),
    (error) => ({ error }),
  );
  await jest.runAllTimersAsync();
  const result = (await settled) as { value?: T; error?: unknown };
  if ('error' in result) throw result.error;
  return result.value as T;
}

const rawAnime = {
  mal_id: 52991,
  title: 'Sousou no Frieren',
  title_english: 'Frieren: Beyond Journey’s End',
  title_japanese: '葬送のフリーレン',
  synopsis: 'Uma elfa maga... [Written by MAL Rewrite]',
  score: 9.3,
  year: 2023,
  images: { webp: { large_image_url: 'https://cdn.myanimelist.net/large.webp' }, jpg: { image_url: 'https://cdn.myanimelist.net/small.jpg' } },
  trailer: { youtube_id: null, embed_url: 'https://www.youtube.com/embed/qgQhrq2ruGg?enablejsapi=1', images: {} },
};

const page = (data: unknown[], hasNext = false) => jsonResponse({ data, pagination: { current_page: 1, has_next_page: hasNext } });

describe('normalização', () => {
  it('prefere o título em inglês, limpa a sinopse e usa o maior pôster', async () => {
    mockFetch(page([rawAnime], true));
    const result = await run(jikan.getSeasonNow());
    expect(result.hasMore).toBe(true);
    expect(result.items[0]).toEqual({
      id: 52991,
      type: 'anime',
      title: 'Frieren: Beyond Journey’s End',
      poster: 'https://cdn.myanimelist.net/large.webp',
      backdrop: null,
      year: '2023',
      rating: 9.3,
      overview: 'Uma elfa maga...',
    });
  });

  it('usa o título romanizado e o ano de estreia quando faltam dados', async () => {
    mockFetch(page([{ mal_id: 1, title: 'Cowboy Bebop', aired: { from: '1998-04-03T00:00:00+00:00' }, images: {} }]));
    const { items } = await run(jikan.searchAnime('bebop'));
    expect(items[0]).toMatchObject({ title: 'Cowboy Bebop', year: '1998', poster: null, rating: null });
  });

  it('remove animes repetidos (a Jikan às vezes devolve duplicados)', async () => {
    mockFetch(page([rawAnime, rawAnime]));
    expect((await run(jikan.getTopAnime())).items).toHaveLength(1);
  });
});

describe('parâmetros', () => {
  it('sempre filtra conteúdo adulto (sfw)', async () => {
    const fetch = mockFetch(page([]), page([]), page([]));
    await run(jikan.searchAnime('naruto'));
    await run(jikan.getTopAnime(2, 'bypopularity'));
    await run(jikan.discoverAnime({}));
    for (let i = 0; i < 3; i++) expect(calledUrl(fetch, i).params.sfw).toBe('true');
    expect(calledUrl(fetch, 1).params).toMatchObject({ page: '2', filter: 'bypopularity' });
  });

  it.each([
    ['popular', { order_by: 'members' }],
    ['top', { order_by: 'score', min_score: '1' }],
    ['recent', { order_by: 'members', status: 'airing' }],
  ] as const)('ordenação "%s"', async (sort, expected) => {
    const fetch = mockFetch(page([]));
    await run(jikan.discoverAnime({ sort, genre: 10 }));
    expect(calledUrl(fetch).params).toMatchObject({ ...expected, genres: '10', sort: 'desc' });
  });
});

describe('limite de requisições', () => {
  it('espaça chamadas seguidas em pelo menos 400 ms', async () => {
    const fetch = mockFetch(page([]), page([]));
    const first = jikan.getSeasonNow();
    const second = jikan.getSeasonNow(2);

    await jest.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(400);
    expect(fetch).toHaveBeenCalledTimes(2);
    await Promise.all([first, second]);
  });

  it('tenta de novo após um 429', async () => {
    const fetch = mockFetch(jsonResponse({}, 429), page([rawAnime]));
    const { items } = await run(jikan.getSeasonNow());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(items).toHaveLength(1);
  });

  it('desiste após 3 respostas 429 com uma mensagem clara', async () => {
    mockFetch(jsonResponse({}, 429), jsonResponse({}, 429), jsonResponse({}, 429));
    await expect(run(jikan.getSeasonNow())).rejects.toThrow('Muitas requisições');
  });

  it('transforma falhas de rede em mensagem amigável', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch')) as unknown as typeof fetch;
    await expect(run(jikan.getSeasonNow())).rejects.toThrow('não respondeu');
  });

  it('aborta requisições que passam de 15 segundos', async () => {
    global.fetch = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    ) as unknown as typeof fetch;
    const promise = jikan.getSeasonNow();
    const assertion = expect(promise).rejects.toThrow('não respondeu');
    await jest.advanceTimersByTimeAsync(15000);
    await assertion;
  });
});

describe('getAnimeDetails', () => {
  const full = {
    ...rawAnime,
    url: 'https://myanimelist.net/anime/52991',
    episodes: 28,
    duration: '24 min per ep',
    status: 'Finished Airing',
    season: 'fall',
    rank: 1,
    aired: { from: '2023-09-29T00:00:00+00:00' },
    studios: [{ name: 'Madhouse' }],
    genres: [{ name: 'Adventure' }],
    themes: [{ name: 'Mythology' }],
    streaming: [{ name: 'Crunchyroll', url: 'https://crunchyroll.com/frieren' }],
  };

  it('extrai trailer do embed_url quando youtube_id vem vazio', async () => {
    mockFetch(jsonResponse({ data: full }));
    expect((await run(jikan.getAnimeDetails(52991))).trailerKey).toBe('qgQhrq2ruGg');
  });

  it('traduz ficha técnica e monta os links de streaming', async () => {
    const fetch = mockFetch(jsonResponse({ data: full }));
    const d = await run(jikan.getAnimeDetails(52991));

    expect(calledUrl(fetch).path).toBe('/v4/anime/52991/full');
    expect(d.originalTitle).toBe('Sousou no Frieren');
    expect(d.genres).toEqual(['Adventure', 'Mythology']);
    expect(d.facts).toEqual(
      expect.arrayContaining([
        { label: 'Temporada', value: 'Outono 2023' },
        { label: 'Episódios', value: '28' },
        { label: 'Duração', value: '24 min por ep.' },
        { label: 'Estúdio', value: 'Madhouse' },
        { label: 'Status', value: 'Finalizado' },
        { label: 'Ranking', value: '#1' },
      ]),
    );
    expect(d.providers).toEqual([{ name: 'Crunchyroll', logo: null, url: 'https://crunchyroll.com/frieren' }]);
    expect(d.externalLabel).toBe('Ver no MyAnimeList');
  });

  it('lê recomendações a partir de "entry"', async () => {
    mockFetch(jsonResponse({ data: [{ entry: rawAnime }] }));
    const recs = await run(jikan.getAnimeRecommendations(1));
    expect(recs[0]).toMatchObject({ id: 52991, type: 'anime' });
  });
});

describe('novidades', () => {
  it('filtra por ano de estreia', async () => {
    const fetch = mockFetch(page([]));
    await run(jikan.discoverAnime({ year: 2023 }));
    expect(calledUrl(fetch).params).toMatchObject({ start_date: '2023-01-01', end_date: '2023-12-31' });
  });

  it('lista personagens principais primeiro, com o dublador japonês', async () => {
    const fetch = mockFetch(
      jsonResponse({
        data: [
          {
            role: 'Supporting',
            favorites: 999,
            character: { mal_id: 3, name: 'Coadjuvante', images: { jpg: { image_url: 'c.jpg' } } },
            voice_actors: [],
          },
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
    const cast = await run(jikan.getAnimeCast(52991));
    expect(calledUrl(fetch).path).toBe('/v4/anime/52991/characters');
    expect(cast).toEqual([
      { id: 1, name: 'Frieren', role: 'Voz: Atsumi Tanezaki', photo: 'f.webp' },
      { id: 3, name: 'Coadjuvante', role: 'Coadjuvante', photo: 'c.jpg' },
    ]);
  });
});
