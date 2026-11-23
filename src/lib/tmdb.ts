import type { Genre, MediaDetails, MediaItem, Page, Provider } from '../types';
import { formatDate, formatRuntime, languageName, uniqueBy, yearOf } from './format';

/*
 * Cliente do TMDB usado no navegador: fala só com o proxy /api/tmdb.
 * A normalização é exportada para ser reaproveitada no servidor (tmdbServer.ts).
 * Este arquivo NÃO pode ler a chave da API — ele vai para o bundle do cliente.
 */

export type TmdbType = 'movie' | 'tv';
export type SortKey = 'popular' | 'top' | 'recent';
export type Params = Record<string, string | number | undefined>;

const IMG_BASE = (process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p').replace(/\/$/, '');
const MAX_PAGE = 500;
export const WATCH_REGION = 'BR';

export function tmdbImage(path: string | null | undefined, size = 'w342'): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export class ApiError extends Error {}

export function toSearchParams(params: Params): URLSearchParams {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v));
  return search;
}

async function request<T = any>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const qs = toSearchParams(params).toString();
  const res = await fetch(`/api/tmdb/${path}${qs ? `?${qs}` : ''}`, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error || body?.status_message || `Erro ${res.status} ao consultar o TMDB`);
  }
  return res.json();
}

/* ---------- normalização ---------- */

function toItem(raw: any, fallbackType?: TmdbType): MediaItem | null {
  const type: TmdbType | undefined = raw.media_type === 'movie' || raw.media_type === 'tv' ? raw.media_type : fallbackType;
  if (!type) return null; // ignora "person" na busca multi
  return {
    id: raw.id,
    type,
    title: raw.title || raw.name || 'Sem título',
    poster: tmdbImage(raw.poster_path, 'w342'),
    backdrop: tmdbImage(raw.backdrop_path, 'w1280'),
    year: yearOf(raw.release_date || raw.first_air_date),
    rating: raw.vote_count > 0 ? raw.vote_average : null,
    overview: raw.overview || '',
  };
}

export function normalizePage(data: any, type?: TmdbType): Page<MediaItem> {
  const items = (data.results || []).map((r: any) => toItem(r, type)).filter(Boolean) as MediaItem[];
  const page = data.page || 1;
  return {
    items: uniqueBy(items, (i) => `${i.type}-${i.id}`),
    page,
    hasMore: page < Math.min(data.total_pages || 1, MAX_PAGE),
  };
}

/* ---------- listas ---------- */

export const trendingPath = (type: TmdbType | 'all', window: 'day' | 'week') => `trending/${type}/${window}`;

export async function getTrending(type: TmdbType | 'all', window: 'day' | 'week' = 'week', page = 1) {
  return normalizePage(await request(trendingPath(type, window), { page }), type === 'all' ? undefined : type);
}

export async function getList(type: TmdbType, list: 'popular' | 'top_rated' | 'now_playing' | 'on_the_air', page = 1) {
  return normalizePage(await request(`${type}/${list}`, { page, region: WATCH_REGION }), type);
}

export interface DiscoverOptions {
  genre?: number;
  sort?: SortKey;
  page?: number;
  year?: number;
  provider?: number;
}

export function discoverParams(type: TmdbType, opts: DiscoverOptions): Params {
  const today = new Date().toISOString().slice(0, 10);
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
  const params: Params = { page: opts.page ?? 1, with_genres: opts.genre || undefined, include_adult: 'false' };

  switch (opts.sort) {
    case 'top':
      params.sort_by = 'vote_average.desc';
      params['vote_count.gte'] = opts.year || opts.provider ? 100 : type === 'movie' ? 1000 : 300;
      break;
    case 'recent':
      params.sort_by = `${dateField}.desc`;
      params[`${dateField}.lte`] = today;
      params['vote_count.gte'] = 30;
      break;
    default:
      params.sort_by = 'popularity.desc';
  }

  if (opts.year) params[type === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = opts.year;
  if (opts.provider) {
    params.with_watch_providers = opts.provider;
    params.watch_region = WATCH_REGION;
    params.with_watch_monetization_types = 'flatrate|free|ads';
  }
  return params;
}

export async function discover(type: TmdbType, opts: DiscoverOptions) {
  return normalizePage(await request(`discover/${type}`, discoverParams(type, opts)), type);
}

export async function searchTmdb(type: TmdbType | 'multi', query: string, page = 1, signal?: AbortSignal) {
  const data = await request(`search/${type}`, { query, page, include_adult: 'false' }, signal);
  return normalizePage(data, type === 'multi' ? undefined : type);
}

export async function getRecommendations(type: TmdbType, id: number) {
  const data = await request(`${type}/${id}/recommendations`);
  return normalizePage(data, type).items;
}

/** Principais serviços de streaming no Brasil, na ordem de destaque do TMDB. */
export async function getStreamingProviders(type: TmdbType, limit = 12): Promise<(Provider & { id: number })[]> {
  const data = await request(`watch/providers/${type}`, { watch_region: WATCH_REGION });
  return (data.results || [])
    .filter((p: any) => p.display_priorities?.[WATCH_REGION] != null && !/justwatch/i.test(p.provider_name))
    .sort((a: any, b: any) => a.display_priorities[WATCH_REGION] - b.display_priorities[WATCH_REGION])
    .slice(0, limit)
    .map((p: any) => ({ id: p.provider_id, name: p.provider_name, logo: tmdbImage(p.logo_path, 'w92') }));
}

/* ---------- detalhes ---------- */

const STATUS: Record<string, string> = {
  Released: 'Lançado',
  'In Production': 'Em produção',
  'Post Production': 'Pós-produção',
  Planned: 'Planejado',
  Rumored: 'Rumor',
  Canceled: 'Cancelado',
  'Returning Series': 'Em exibição',
  Ended: 'Finalizada',
  Pilot: 'Piloto',
};

export const DETAILS_PARAMS: Params = {
  append_to_response: 'credits,videos,watch/providers',
  include_video_language: 'pt,en,null',
};

export function normalizeTmdbDetails(type: TmdbType, id: number, d: any): MediaDetails {
  const base = toItem(d, type)!;
  const facts: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null | undefined) => value && facts.push({ label, value });

  if (type === 'movie') {
    push('Lançamento', formatDate(d.release_date));
    push('Duração', formatRuntime(d.runtime));
    push('Direção', (d.credits?.crew || []).filter((c: any) => c.job === 'Director').map((c: any) => c.name).join(', '));
  } else {
    push('Estreia', formatDate(d.first_air_date));
    push('Temporadas', d.number_of_seasons ? String(d.number_of_seasons) : null);
    push('Episódios', d.number_of_episodes ? String(d.number_of_episodes) : null);
    push('Criação', (d.created_by || []).map((c: any) => c.name).join(', '));
    push('Emissora', (d.networks || []).slice(0, 2).map((n: any) => n.name).join(', '));
  }
  push('Status', STATUS[d.status] || d.status);
  push('Idioma original', languageName(d.original_language));

  const videos: any[] = d.videos?.results || [];
  const trailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.iso_639_1 === 'pt') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  const br = d['watch/providers']?.results?.[WATCH_REGION];
  const providerList: any[] = br?.flatrate || br?.free || br?.ads || br?.rent || br?.buy || [];
  const original = d.original_title || d.original_name;

  return {
    ...base,
    backdrop: tmdbImage(d.backdrop_path, 'original') || base.backdrop,
    poster: tmdbImage(d.poster_path, 'w500'),
    originalTitle: original && original !== base.title ? original : null,
    tagline: d.tagline || null,
    genres: (d.genres || []).map((g: any) => g.name),
    facts,
    cast: (d.credits?.cast || []).slice(0, 15).map((c: any) => ({
      id: c.id,
      name: c.name,
      role: c.character || '',
      photo: tmdbImage(c.profile_path, 'w185'),
    })),
    trailerKey: trailer?.key || null,
    providers: uniqueBy(providerList, (p: any) => p.provider_id)
      .slice(0, 8)
      .map((p: any) => ({ name: p.provider_name, logo: tmdbImage(p.logo_path, 'w92') })),
    providersLink: br?.link || null,
    externalUrl: `https://www.themoviedb.org/${type}/${id}`,
    externalLabel: 'Ver no TMDB',
  };
}

export async function getTmdbDetails(type: TmdbType, id: number): Promise<MediaDetails> {
  return normalizeTmdbDetails(type, id, await request(`${type}/${id}`, DETAILS_PARAMS));
}

/* ---------- gêneros (estáticos para evitar requisições extras) ---------- */

export const MOVIE_GENRES: Genre[] = [
  { id: 28, name: 'Ação' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentário' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Família' },
  { id: 14, name: 'Fantasia' },
  { id: 878, name: 'Ficção científica' },
  { id: 27, name: 'Terror' },
  { id: 9648, name: 'Mistério' },
  { id: 10749, name: 'Romance' },
  { id: 53, name: 'Suspense' },
  { id: 36, name: 'História' },
  { id: 10752, name: 'Guerra' },
  { id: 10402, name: 'Música' },
  { id: 37, name: 'Faroeste' },
];

export const TV_GENRES: Genre[] = [
  { id: 10759, name: 'Ação e aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentário' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Família' },
  { id: 10765, name: 'Ficção e fantasia' },
  { id: 9648, name: 'Mistério' },
  { id: 10764, name: 'Reality' },
  { id: 10762, name: 'Infantil' },
  { id: 10768, name: 'Guerra e política' },
  { id: 37, name: 'Faroeste' },
];
