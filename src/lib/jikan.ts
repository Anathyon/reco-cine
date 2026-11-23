import type { CastMember, Genre, MediaDetails, MediaItem, Page } from '../types';
import { formatDate, uniqueBy, yearOf } from './format';
import { ApiError } from './tmdb';

const BASE = (process.env.NEXT_PUBLIC_JIKAN_BASE_URL || 'https://api.jikan.moe/v4').replace(/\/$/, '');

/*
 * A Jikan limita a ~3 requisições por segundo. Cada chamada recebe um
 * "horário de saída" espaçado das demais, e tenta de novo em caso de 429.
 */
const MIN_GAP_MS = 400;
const TIMEOUT_MS = 15000;
let nextSlot = 0;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function schedule<T>(task: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const start = Math.max(now, nextSlot);
  nextSlot = start + MIN_GAP_MS;
  return wait(start - now).then(task);
}

async function fetchWithTimeout(url: string, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('O serviço de animes (MyAnimeList) não respondeu. Tente novamente em instantes.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function request<T = any>(path: string, params: Record<string, string | number | undefined> = {}, signal?: AbortSignal): Promise<T> {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v));
  const qs = search.toString();
  const url = `${BASE}/${path}${qs ? `?${qs}` : ''}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const res = await schedule(() => fetchWithTimeout(url, signal));
    if (res.status === 429) {
      await wait(1000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new ApiError(`Erro ${res.status} ao consultar animes`);
    return res.json();
  }
  throw new ApiError('Muitas requisições ao serviço de animes. Tente novamente em instantes.');
}

/* ---------- normalização ---------- */

function cleanSynopsis(text?: string | null): string {
  if (!text) return '';
  return text.replace(/\s*\[Written by MAL Rewrite\]\s*$/i, '').replace(/\s*\(Source:[^)]*\)\s*$/i, '').trim();
}

function toItem(a: any): MediaItem {
  return {
    id: a.mal_id,
    type: 'anime',
    title: a.title_english || a.title,
    poster: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || null,
    backdrop: a.trailer?.images?.maximum_image_url || null,
    year: a.year ? String(a.year) : yearOf(a.aired?.from),
    rating: a.score || null,
    overview: cleanSynopsis(a.synopsis),
  };
}

function toPage(data: any): Page<MediaItem> {
  return {
    items: uniqueBy((data.data || []).map(toItem), (i: MediaItem) => i.id),
    page: data.pagination?.current_page || 1,
    hasMore: Boolean(data.pagination?.has_next_page),
  };
}

/* ---------- listas ---------- */

export type AnimeSort = 'popular' | 'top' | 'recent';

export async function getSeasonNow(page = 1) {
  return toPage(await request('seasons/now', { page, sfw: 'true', limit: 24 }));
}

export async function getTopAnime(page = 1, filter?: 'airing' | 'bypopularity') {
  return toPage(await request('top/anime', { page, filter, sfw: 'true', limit: 24 }));
}

export async function discoverAnime(opts: { genre?: number; sort?: AnimeSort; page?: number; year?: number }) {
  const params: Record<string, string | number | undefined> = {
    page: opts.page ?? 1,
    genres: opts.genre || undefined,
    sfw: 'true',
    limit: 24,
    sort: 'desc',
  };
  if (opts.year) {
    params.start_date = `${opts.year}-01-01`;
    params.end_date = `${opts.year}-12-31`;
  }
  if (opts.sort === 'top') {
    params.order_by = 'score';
    params.min_score = 1;
  } else if (opts.sort === 'recent') {
    params.status = 'airing';
    params.order_by = 'members';
  } else {
    params.order_by = 'members';
  }
  return toPage(await request('anime', params));
}

export async function searchAnime(query: string, page = 1, signal?: AbortSignal) {
  return toPage(await request('anime', { q: query, page, sfw: 'true', limit: 24, order_by: 'members', sort: 'desc' }, signal));
}

export async function getAnimeRecommendations(id: number): Promise<MediaItem[]> {
  const data = await request(`anime/${id}/recommendations`);
  return (data.data || []).slice(0, 20).map((r: any) => toItem(r.entry));
}

/* ---------- detalhes ---------- */

const STATUS: Record<string, string> = {
  'Finished Airing': 'Finalizado',
  'Currently Airing': 'Em exibição',
  'Not yet aired': 'Ainda não lançado',
};

const SEASONS: Record<string, string> = { winter: 'Inverno', spring: 'Primavera', summer: 'Verão', fall: 'Outono' };

/** Personagens principais com o dublador japonês (a Jikan não traz elenco "real"). */
export async function getAnimeCast(id: number): Promise<CastMember[]> {
  const { data } = await request(`anime/${id}/characters`);
  return (data || [])
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

export async function getAnimeDetails(id: number): Promise<MediaDetails> {
  const { data } = await request(`anime/${id}/full`);
  return normalizeAnimeDetails(id, data);
}

export function normalizeAnimeDetails(id: number, a: any): MediaDetails {
  const base = toItem(a);
  const facts: { label: string; value: string }[] = [];
  const push = (label: string, value: string | null | undefined) => value && facts.push({ label, value });

  push('Estreia', formatDate(a.aired?.from));
  push('Temporada', a.season && a.year ? `${SEASONS[a.season] ?? a.season} ${a.year}` : null);
  push('Episódios', a.episodes ? String(a.episodes) : null);
  push('Duração', a.duration?.replace(' per ep', ' por ep.').replace(' hr', 'h'));
  push('Estúdio', (a.studios || []).map((s: any) => s.name).join(', '));
  push('Status', STATUS[a.status] || a.status);
  push('Ranking', a.rank ? `#${a.rank}` : null);

  const trailerKey =
    a.trailer?.youtube_id || a.trailer?.embed_url?.match(/embed\/([\w-]{11})/)?.[1] || null;

  return {
    ...base,
    originalTitle: base.title !== a.title ? a.title : a.title_japanese || null,
    tagline: null,
    genres: [...(a.genres || []), ...(a.themes || [])].map((g: any) => g.name),
    facts,
    cast: [],
    trailerKey,
    providers: (a.streaming || []).slice(0, 8).map((s: any) => ({ name: s.name, logo: null, url: s.url })),
    providersLink: null,
    externalUrl: a.url || `https://myanimelist.net/anime/${id}`,
    externalLabel: 'Ver no MyAnimeList',
  };
}

export const ANIME_GENRES: Genre[] = [
  { id: 1, name: 'Ação' },
  { id: 2, name: 'Aventura' },
  { id: 4, name: 'Comédia' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasia' },
  { id: 62, name: 'Isekai' },
  { id: 24, name: 'Ficção científica' },
  { id: 22, name: 'Romance' },
  { id: 36, name: 'Slice of life' },
  { id: 30, name: 'Esportes' },
  { id: 37, name: 'Sobrenatural' },
  { id: 7, name: 'Mistério' },
  { id: 40, name: 'Psicológico' },
  { id: 14, name: 'Terror' },
  { id: 18, name: 'Mecha' },
];
