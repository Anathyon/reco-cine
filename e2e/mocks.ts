import type { Page, Route } from '@playwright/test';

/*
 * Respostas simuladas do TMDB (via /api/tmdb) e do MyAnimeList (via /api/anime).
 * Os dados são fictícios, mas seguem o formato real das APIs.
 */

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

type Raw = Record<string, any>;

export const MOVIES: Raw[] = [
  { id: 101, title: 'Filme Alfa', overview: 'Uma aventura no espaço profundo.', release_date: '2024-05-01', genre_ids: [28] },
  { id: 102, title: 'Filme Beta', overview: 'Um drama sobre família e escolhas.', release_date: '2023-03-10', genre_ids: [18] },
  { id: 103, title: 'Filme Gama', overview: 'Comédia de erros numa cidade pequena.', release_date: '2022-11-20', genre_ids: [35] },
  { id: 104, title: 'Filme Delta', overview: 'Suspense em um trem noturno.', release_date: '2021-01-15', genre_ids: [53] },
].map((m, i) => ({
  ...m,
  media_type: 'movie',
  poster_path: `/poster-m${m.id}.jpg`,
  backdrop_path: `/backdrop-m${m.id}.jpg`,
  vote_average: 8 - i * 0.5,
  vote_count: 1000,
}));

export const SERIES: Raw[] = [
  { id: 201, name: 'Série Ômega', overview: 'Uma série de mistério em uma ilha.', first_air_date: '2020-09-01' },
  { id: 202, name: 'Série Sigma', overview: 'Investigadores resolvem crimes antigos.', first_air_date: '2019-02-02' },
].map((s, i) => ({
  ...s,
  media_type: 'tv',
  poster_path: `/poster-t${s.id}.jpg`,
  backdrop_path: `/backdrop-t${s.id}.jpg`,
  vote_average: 8.5 - i,
  vote_count: 500,
}));

export const ANIMES: Raw[] = [
  { id: 301, title: 'Kappa Chronicles', originalTitle: 'Anime Kappa', rating: 8.9, year: '2023' },
  { id: 302, title: 'Anime Lambda', originalTitle: null, rating: 7.4, year: '2021' },
].map((a) => ({
  ...a,
  type: 'anime',
  overview: `Sinopse de ${a.originalTitle || a.title}.`,
  poster: `https://cdn.myanimelist.net/${a.id}l.jpg`,
  backdrop: null,
}));

export const PEOPLE: Raw[] = [
  {
    id: 1,
    name: 'Atriz Exemplo',
    known_for_department: 'Acting',
    profile_path: '/actor.jpg',
    known_for: [{ title: 'Filme Alfa' }],
  },
];

/** Índice da busca tolerante a erros (/api/search/catalog). */
const SEARCH_INDEX = [
  ...MOVIES.map((m) => ({ k: 'movie', id: m.id, t: m.title, y: m.release_date.slice(0, 4), p: m.poster_path })),
  ...SERIES.map((s) => ({ k: 'tv', id: s.id, t: s.name, y: s.first_air_date.slice(0, 4), p: s.poster_path })),
  ...ANIMES.map((a) => ({ k: 'anime', id: a.id, t: a.title, o: a.originalTitle ?? undefined, y: a.year, p: a.poster })),
  ...PEOPLE.map((p) => ({ k: 'person', id: p.id, t: p.name })),
];

const list = (results: Raw[]) => ({ page: 1, total_pages: 1, total_results: results.length, results });
const animePage = (items: Raw[]) => ({ items: items.map(({ originalTitle: _o, ...item }) => item), page: 1, hasMore: false });

function tmdbDetails(type: 'movie' | 'tv', raw: Raw) {
  return {
    ...raw,
    genres: [{ id: 18, name: 'Drama' }],
    runtime: 125,
    number_of_seasons: 2,
    status: type === 'movie' ? 'Released' : 'Returning Series',
    original_language: 'en',
    tagline: 'Toda história tem um começo.',
    credits: {
      cast: [{ id: 1, name: 'Atriz Exemplo', character: 'Protagonista', profile_path: '/actor.jpg' }],
      crew: [{ name: 'Diretora Exemplo', job: 'Director' }],
    },
    videos: { results: [{ site: 'YouTube', type: 'Trailer', key: 'dQw4w9WgXcQ', iso_639_1: 'pt' }] },
    'watch/providers': {
      results: { BR: { link: 'https://www.themoviedb.org/watch', flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.jpg' }] } },
    },
  };
}

export interface MockOptions {
  /** Força um erro em rotas do TMDB que casem com esta expressão. */
  failTmdb?: RegExp;
}

function handleTmdb(route: Route, options: MockOptions) {
  const url = new URL(route.request().url());
  const path = url.pathname.replace(/^\/api\/tmdb\//, '');
  const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });

  if (options.failTmdb?.test(path)) return json({ error: 'Falha simulada do TMDB' }, 502);

  if (path.startsWith('trending/')) {
    if (path.startsWith('trending/tv')) return json(list(SERIES));
    if (path.startsWith('trending/movie')) return json(list(MOVIES));
    return json(list([...MOVIES, ...SERIES]));
  }
  if (/^(movie|tv)\/(popular|top_rated|now_playing|on_the_air)$/.test(path)) {
    return json(list(path.startsWith('tv') ? SERIES : MOVIES));
  }
  if (/^discover\/(movie|tv)$/.test(path)) {
    const pool = path.endsWith('tv') ? SERIES : MOVIES;
    const genre = Number(url.searchParams.get('with_genres'));
    return json(list(genre ? pool.filter((m) => m.genre_ids?.includes(genre)) : pool));
  }
  if (path === 'search/person') {
    const q = (url.searchParams.get('query') || '').toLowerCase();
    return json(list(PEOPLE.filter((p) => p.name.toLowerCase().includes(q))));
  }
  const person = path.match(/^person\/(\d+)$/);
  if (person) {
    const raw = PEOPLE.find((p) => p.id === Number(person[1]));
    if (!raw) return json({ status_message: 'not found' }, 404);
    return json({
      ...raw,
      biography: '',
      birthday: '1970-01-01',
      combined_credits: { cast: [{ ...MOVIES[0], character: 'Protagonista' }, { ...SERIES[0], character: 'Detetive' }], crew: [] },
    });
  }
  if (/^search\/(multi|movie|tv)$/.test(path)) {
    const q = (url.searchParams.get('query') || '').toLowerCase();
    const pool = path.endsWith('movie') ? MOVIES : path.endsWith('tv') ? SERIES : [...MOVIES, ...SERIES];
    return json(list(pool.filter((m) => (m.title || m.name).toLowerCase().includes(q))));
  }
  if (/^watch\/providers\/(movie|tv)$/.test(path)) {
    return json({
      results: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.jpg', display_priorities: { BR: 1 } },
        { provider_id: 119, provider_name: 'Amazon Prime Video', logo_path: '/pv.jpg', display_priorities: { BR: 2 } },
      ],
    });
  }
  const rec = path.match(/^(movie|tv)\/(\d+)\/recommendations$/);
  if (rec) return json(list(rec[1] === 'tv' ? SERIES.slice(0, 1) : MOVIES.slice(1, 3)));

  const detail = path.match(/^(movie|tv)\/(\d+)$/);
  if (detail) {
    const pool = detail[1] === 'tv' ? SERIES : MOVIES;
    const raw = pool.find((m) => m.id === Number(detail[2]));
    return raw ? json(tmdbDetails(detail[1] as 'movie' | 'tv', raw)) : json({ status_message: 'not found' }, 404);
  }
  return json({ status_message: `rota não simulada: ${path}` }, 404);
}

function handleAnime(route: Route) {
  const url = new URL(route.request().url());
  const path = url.pathname.replace(/^\/api\/anime\//, '');
  const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });

  if (path === 'season' || path === 'top' || path === 'discover') return json(animePage(ANIMES));
  if (path === 'search') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    return json(animePage(ANIMES.filter((a) => `${a.title} ${a.originalTitle}`.toLowerCase().includes(q))));
  }
  const match = path.match(/^(\d+)(?:\/(characters|recommendations))?$/);
  const anime = match && ANIMES.find((a) => a.id === Number(match[1]));
  if (match && anime) {
    if (match[2] === 'characters') return json([{ id: 1, name: 'Personagem Principal', role: 'Voz: Dubladora Exemplo', photo: null }]);
    if (match[2] === 'recommendations') return json([]);
    return json({
      ...anime,
      tagline: null,
      genres: [],
      facts: [
        { label: 'Episódios', value: '12' },
        { label: 'Estúdio', value: 'Estúdio X' },
        { label: 'Status', value: 'Finalizado' },
      ],
      cast: [],
      trailerKey: null,
      providers: [],
      providersLink: null,
      externalUrl: `https://myanimelist.net/anime/${anime.id}`,
      externalLabel: 'Ver no MyAnimeList',
    });
  }
  return json({ error: 'Anime não encontrado' }, 404);
}

export async function mockApis(page: Page, options: MockOptions = {}) {
  const image = (route: Route) => route.fulfill({ contentType: 'image/png', body: PNG });
  await page.route('https://image.tmdb.org/**', image);
  await page.route('https://cdn.myanimelist.net/**', image);
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<p>trailer</p>' }));
  await page.route('**/api/tmdb/**', (route) => handleTmdb(route, options));
  await page.route('**/api/anime/**', handleAnime);
  await page.route('**/api/search/catalog', (route) => route.fulfill({ json: SEARCH_INDEX }));
  await page.route('**/api/search/spell**', (route) => route.fulfill({ json: { suggestion: null } }));
  await page.route('**/api/translate/**', (route) => {
    const [, type, id] = new URL(route.request().url()).pathname.match(/\/api\/translate\/(\w+)\/(\d+)/) ?? [];
    const original = type === 'person' ? 'Born in Exampleville.' : `Original synopsis ${id}.`;
    return route.fulfill({
      json: { text: `Texto traduzido ${type} ${id}.`, original, from: 'en', to: 'pt', translated: true },
    });
  });
}
