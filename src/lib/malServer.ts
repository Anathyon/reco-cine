/*
 * Acesso à API oficial do MyAnimeList (v2), SOMENTE no servidor (rota /api/anime
 * e getStaticProps). Nunca importe este arquivo em componentes: ele lê o Client ID.
 *
 * A API oficial não tem personagens nem trailers; esses dados vêm da Jikan
 * (espelho não oficial do MAL) quando ela está no ar, sem bloquear o resto.
 */
import type { CastMember, MediaDetails, MediaItem, Page } from '../types';
import { formatDate, uniqueBy } from './format';
import type { AnimeSort } from './anime';

export const PAGE_SIZE = 24;

export const malClientId = () => process.env.MAL_CLIENT_ID || '';

const baseUrl = () => (process.env.MAL_BASE_URL || 'https://api.myanimelist.net/v2').replace(/\/$/, '');
const jikanUrl = () => (process.env.JIKAN_BASE_URL || process.env.NEXT_PUBLIC_JIKAN_BASE_URL || 'https://api.jikan.moe/v4').replace(/\/$/, '');

/** Campos pedidos para cada anime em listas. */
const LIST_FIELDS = 'alternative_titles,mean,start_date,start_season,synopsis,genres,status,num_list_users';
const DETAILS_FIELDS = [
  'alternative_titles',
  'start_date',
  'synopsis',
  'mean',
  'rank',
  'status',
  'genres',
  'num_episodes',
  'start_season',
  'average_episode_duration',
  'studios',
  `recommendations{${LIST_FIELDS}}`,
].join(',');

/**
 * Listas e catálogos não mostram conteúdo adulto (a API já filtra; isto é uma
 * garantia extra). A busca, ao contrário, mostra tudo: quem procura um título
 * específico deve encontrá-lo.
 */
const ADULT_GENRES = new Set([12, 49]);

export class MalError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | undefined>;

export async function mal<T = any>(path: string, params: Params = {}, timeoutMs = 10000): Promise<T> {
  const id = malClientId();
  if (!id) throw new MalError('Client ID do MyAnimeList não configurado no servidor', 500);
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v));
  const qs = search.toString();

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/${path}${qs ? `?${qs}` : ''}`, {
      headers: { 'X-MAL-CLIENT-ID': id, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new MalError('O MyAnimeList não respondeu', 504);
  }
  if (!res.ok) throw new MalError(`MyAnimeList respondeu ${res.status}`, res.status);
  return res.json();
}

/* ---------- normalização ---------- */

export function cleanSynopsis(text?: string | null): string {
  if (!text) return '';
  return text.replace(/\s*\[Written by MAL Rewrite\]\s*$/i, '').replace(/\s*\(Source:[^)]*\)\s*$/i, '').trim();
}

const yearOf = (a: any): string | null =>
  a.start_season?.year ? String(a.start_season.year) : a.start_date ? String(a.start_date).slice(0, 4) : null;

export function toItem(a: any): MediaItem {
  return {
    id: a.id,
    type: 'anime',
    title: a.alternative_titles?.en || a.title,
    poster: a.main_picture?.large || a.main_picture?.medium || null,
    backdrop: null,
    year: yearOf(a),
    rating: a.mean || null,
    overview: cleanSynopsis(a.synopsis),
  };
}

const isSafe = (a: any) => !(a.genres || []).some((g: any) => ADULT_GENRES.has(g.id));
const nodes = (data: any): any[] => (data?.data || []).map((d: any) => d.node).filter(Boolean);
const toItems = (raw: any[], { includeAdult = false } = {}) =>
  uniqueBy((includeAdult ? raw : raw.filter(isSafe)).map(toItem), (i: MediaItem) => i.id);

/* ---------- listas ---------- */

type RankingType = 'all' | 'airing' | 'bypopularity';

async function ranking(type: RankingType, offset: number, limit: number) {
  const data = await mal('anime/ranking', { ranking_type: type, offset, limit, fields: LIST_FIELDS });
  return { raw: nodes(data), hasNext: Boolean(data?.paging?.next) };
}

export async function topAnime(page = 1, filter?: 'airing' | 'bypopularity'): Promise<Page<MediaItem>> {
  const { raw, hasNext } = await ranking(filter || 'all', (page - 1) * PAGE_SIZE, PAGE_SIZE);
  return { items: toItems(raw), page, hasMore: hasNext };
}

const SEASONS = ['winter', 'spring', 'summer', 'fall'] as const;

export function currentSeason(date = new Date()) {
  return { year: date.getUTCFullYear(), season: SEASONS[Math.floor(date.getUTCMonth() / 3)] };
}

async function seasonList(year: number, season: string) {
  const data = await mal(`anime/season/${year}/${season}`, { sort: 'anime_num_list_users', limit: 500, fields: LIST_FIELDS });
  return nodes(data);
}

/** Animes que estrearam na temporada atual (sem as séries longas que continuam no ar). */
export async function seasonNow(page = 1): Promise<Page<MediaItem>> {
  const { year, season } = currentSeason();
  const all = await seasonList(year, season);
  const fresh = all.filter((a) => a.start_season?.year === year && a.start_season?.season === season);
  const pool = toItems(fresh.length >= PAGE_SIZE ? fresh : all);
  const start = (page - 1) * PAGE_SIZE;
  return { items: pool.slice(start, start + PAGE_SIZE), page, hasMore: pool.length > start + PAGE_SIZE };
}

export async function searchAnime(q: string, page = 1): Promise<Page<MediaItem>> {
  // A API oficial recusa buscas com menos de 3 letras.
  if (q.trim().length < 3) return { items: [], page, hasMore: false };
  const data = await mal('anime', {
    q: q.trim().slice(0, 64),
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    fields: LIST_FIELDS,
    // Busca completa: inclui títulos +18, que a API esconde por padrão.
    nsfw: 'true',
  });
  return { items: toItems(nodes(data), { includeAdult: true }), page, hasMore: Boolean(data?.paging?.next) };
}

const RANKING_FOR: Record<AnimeSort, RankingType> = { popular: 'bypopularity', top: 'all', recent: 'airing' };

/** Bloco lido de cada vez quando é preciso filtrar por gênero (a API não filtra). */
const SCAN_CHUNK = 500;
const SCAN_MAX_CHUNKS = 20;

export async function discoverAnime(opts: { genre?: number; sort?: AnimeSort; page?: number; year?: number }): Promise<Page<MediaItem>> {
  const sort = opts.sort || 'popular';
  const page = Math.max(1, opts.page || 1);
  const hasGenre = (a: any) => !opts.genre || (a.genres || []).some((g: any) => g.id === opts.genre);

  if (opts.year) {
    const seasons = await Promise.all(SEASONS.map((s) => seasonList(opts.year!, s)));
    let pool = uniqueBy(seasons.flat(), (a: any) => a.id).filter((a) => a.start_season?.year === opts.year && hasGenre(a));
    if (sort === 'recent') pool = pool.filter((a) => a.status === 'currently_airing');
    pool.sort((a, b) => (sort === 'top' ? (b.mean || 0) - (a.mean || 0) : (b.num_list_users || 0) - (a.num_list_users || 0)));
    const items = toItems(pool);
    const start = (page - 1) * PAGE_SIZE;
    return { items: items.slice(start, start + PAGE_SIZE), page, hasMore: items.length > start + PAGE_SIZE };
  }

  if (!opts.genre) {
    const { raw, hasNext } = await ranking(RANKING_FOR[sort], (page - 1) * PAGE_SIZE, PAGE_SIZE);
    return { items: toItems(raw), page, hasMore: hasNext };
  }

  /*
   * Com gênero, lê o ranking em blocos grandes e filtra aqui. Aqui "page" é o
   * número do bloco: devolvemos o último bloco lido, e a próxima chamada segue dele.
   */
  const collected: any[] = [];
  let chunk = page;
  let hasNext = true;
  while (chunk <= SCAN_MAX_CHUNKS) {
    const res = await ranking(RANKING_FOR[sort], (chunk - 1) * SCAN_CHUNK, SCAN_CHUNK);
    collected.push(...res.raw.filter(hasGenre));
    hasNext = res.hasNext;
    if (!hasNext || collected.length >= 12 || chunk - page >= 2) break;
    chunk++;
  }
  return { items: toItems(collected), page: chunk, hasMore: hasNext && chunk < SCAN_MAX_CHUNKS };
}

/* ---------- detalhes ---------- */

const STATUS: Record<string, string> = {
  finished_airing: 'Finalizado',
  currently_airing: 'Em exibição',
  not_yet_aired: 'Ainda não lançado',
};

/** Gêneros, temas e demografias do MyAnimeList em português. */
const GENRES_PT: Record<string, string> = {
  Action: 'Ação', Adventure: 'Aventura', 'Avant Garde': 'Vanguarda', 'Award Winning': 'Premiado', Comedy: 'Comédia',
  Drama: 'Drama', Fantasy: 'Fantasia', Gourmet: 'Gastronomia', Horror: 'Terror', Mystery: 'Mistério', Romance: 'Romance',
  'Sci-Fi': 'Ficção científica', 'Slice of Life': 'Slice of life', Sports: 'Esportes', Supernatural: 'Sobrenatural',
  Suspense: 'Suspense', Erotica: 'Erótico', 'Adult Cast': 'Elenco adulto', Anthropomorphic: 'Antropomórfico',
  Childcare: 'Cuidado infantil', 'Combat Sports': 'Esportes de combate', Delinquents: 'Delinquentes', Detective: 'Detetive',
  Educational: 'Educativo', 'Gag Humor': 'Humor pastelão', Harem: 'Harém', 'High Stakes Game': 'Jogo de alto risco',
  Historical: 'Histórico', 'Idols (Female)': 'Idols (feminino)', 'Idols (Male)': 'Idols (masculino)',
  'Love Polygon': 'Triângulo amoroso', 'Magical Sex Shift': 'Troca de gênero mágica', 'Mahou Shoujo': 'Garota mágica',
  'Martial Arts': 'Artes marciais', Medical: 'Medicina', Military: 'Militar', Music: 'Música', Mythology: 'Mitologia',
  'Organized Crime': 'Crime organizado', 'Otaku Culture': 'Cultura otaku', Parody: 'Paródia', 'Performing Arts': 'Artes cênicas',
  Pets: 'Animais de estimação', Psychological: 'Psicológico', Racing: 'Corrida', Reincarnation: 'Reencarnação',
  'Reverse Harem': 'Harém reverso', 'Romantic Subtext': 'Subtexto romântico', School: 'Escolar', Showbiz: 'Mundo artístico',
  Space: 'Espaço', 'Strategy Game': 'Jogo de estratégia', 'Super Power': 'Superpoderes', Survival: 'Sobrevivência',
  'Team Sports': 'Esportes coletivos', 'Time Travel': 'Viagem no tempo', 'Urban Fantasy': 'Fantasia urbana',
  Vampire: 'Vampiros', 'Video Game': 'Videogame', Villainess: 'Vilã', 'Visual Arts': 'Artes visuais',
  Workplace: 'Ambiente de trabalho', Kids: 'Infantil',
};

export const genreName = (name: string) => GENRES_PT[name] ?? name;

const SEASON_LABEL: Record<string, string> = { winter: 'Inverno', spring: 'Primavera', summer: 'Verão', fall: 'Outono' };

function duration(seconds?: number): string | null {
  if (!seconds) return null;
  const min = Math.round(seconds / 60);
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60} min por ep.` : `${min} min por ep.`;
}

export function normalizeMalDetails(id: number, a: any, extras: JikanExtras = {}): MediaDetails {
  const base = toItem(a);
  const facts: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null | undefined) => value && facts.push({ label, value });

  push('Estreia', formatDate(a.start_date));
  push('Temporada', a.start_season ? `${SEASON_LABEL[a.start_season.season] ?? a.start_season.season} ${a.start_season.year}` : null);
  push('Episódios', a.num_episodes ? String(a.num_episodes) : null);
  push('Duração', duration(a.average_episode_duration));
  push('Estúdio', (a.studios || []).map((s: any) => s.name).join(', '));
  push('Status', STATUS[a.status] || a.status);
  push('Ranking', a.rank ? `#${a.rank}` : null);

  return {
    ...base,
    backdrop: extras.backdrop ?? null,
    originalTitle: base.title !== a.title ? a.title : a.alternative_titles?.ja || null,
    tagline: null,
    genres: (a.genres || []).map((g: any) => genreName(g.name)),
    facts,
    cast: [],
    trailerKey: extras.trailerKey ?? null,
    providers: extras.providers ?? [],
    providersLink: null,
    externalUrl: `https://myanimelist.net/anime/${id}`,
    externalLabel: 'Ver no MyAnimeList',
  };
}

async function rawDetails(id: number) {
  return mal(`anime/${id}`, { fields: DETAILS_FIELDS });
}

export async function animeDetails(id: number): Promise<MediaDetails> {
  const [raw, extras] = await Promise.all([rawDetails(id), jikanExtras(id)]);
  return normalizeMalDetails(id, raw, extras);
}

export async function animeRecommendations(id: number): Promise<MediaItem[]> {
  const raw = await rawDetails(id);
  return toItems((raw.recommendations || []).map((r: any) => r.node)).slice(0, 20);
}

/* ---------- complementos da Jikan (opcionais) ---------- */

export interface JikanExtras {
  trailerKey?: string | null;
  backdrop?: string | null;
  providers?: { name: string; logo: null; url: string }[];
}

async function jikan<T = any>(path: string, timeoutMs: number): Promise<T | null> {
  try {
    const res = await fetch(`${jikanUrl()}/${path}`, { signal: AbortSignal.timeout(timeoutMs) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Trailer, imagem de fundo e onde assistir. Se a Jikan falhar, devolve vazio. */
export async function jikanExtras(id: number, timeoutMs = 3500): Promise<JikanExtras> {
  const body = await jikan(`anime/${id}/full`, timeoutMs);
  const a = body?.data;
  if (!a) return {};
  return {
    trailerKey: a.trailer?.youtube_id || a.trailer?.embed_url?.match(/embed\/([\w-]{11})/)?.[1] || null,
    backdrop: a.trailer?.images?.maximum_image_url || null,
    providers: (a.streaming || []).slice(0, 8).map((s: any) => ({ name: s.name, logo: null, url: s.url })),
  };
}

/** Personagens principais com o dublador japonês. Se a Jikan falhar, a lista fica vazia. */
export async function animeCast(id: number, timeoutMs = 5000): Promise<CastMember[]> {
  const body = await jikan(`anime/${id}/characters`, timeoutMs);
  return (body?.data || [])
    .sort((a: any, b: any) => (a.role === b.role ? (b.favorites || 0) - (a.favorites || 0) : a.role === 'Main' ? -1 : 1))
    .slice(0, 15)
    .map((c: any) => {
      const va = (c.voice_actors || []).find((v: any) => v.language === 'Japanese') || c.voice_actors?.[0];
      return {
        id: c.character.mal_id,
        name: c.character.name,
        role: va ? `Voz: ${va.person.name}` : c.role === 'Main' ? 'Principal' : 'Coadjuvante',
        photo: c.character.images?.webp?.image_url || c.character.images?.jpg?.image_url || null,
      };
    });
}
