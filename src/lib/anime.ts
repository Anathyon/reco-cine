/*
 * Cliente de animes usado pelo navegador. Todas as chamadas passam pela rota
 * /api/anime, que consulta a API oficial do MyAnimeList com o Client ID guardado
 * no servidor e já devolve os dados no formato da interface (MediaItem).
 */
import type { CastMember, Genre, MediaDetails, MediaItem, Page } from '../types';
import { ApiError } from './tmdb';
import { adultAuthHeader } from './adult';

export type AnimeSort = 'popular' | 'top' | 'recent';

const TIMEOUT_MS = 20000;

async function request<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  signal?: AbortSignal,
  adult = false,
): Promise<T> {
  if (adult) params = { ...params, adult: 1 };
  const headers = adult ? await adultAuthHeader() : undefined;
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') search.set(k, String(v));
  const qs = search.toString();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  let res: Response;
  try {
    res = await fetch(`/api/anime/${path}${qs ? `?${qs}` : ''}`, headers ? { signal: controller.signal, headers } : { signal: controller.signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError('O serviço de animes (MyAnimeList) não respondeu. Tente novamente em instantes.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error || `Erro ${res.status} ao consultar animes`);
  }
  return res.json();
}

/* ---------- listas ---------- */

export function getSeasonNow(page = 1) {
  return request<Page<MediaItem>>('season', { page });
}

export function getTopAnime(page = 1, filter?: 'airing' | 'bypopularity') {
  return request<Page<MediaItem>>('top', { page, filter });
}

export function discoverAnime(opts: { genre?: number; sort?: AnimeSort; page?: number; year?: number }) {
  return request<Page<MediaItem>>('discover', { page: opts.page ?? 1, genre: opts.genre, sort: opts.sort, year: opts.year });
}

/** `adult`: inclui títulos +18 (o servidor confere login e idade). */
export function searchAnime(query: string, page = 1, signal?: AbortSignal, adult = false) {
  return request<Page<MediaItem>>('search', { q: query, page }, signal, adult);
}

/* ---------- detalhes ---------- */

export function getAnimeDetails(id: number) {
  return request<MediaDetails>(String(id));
}

export function getAnimeRecommendations(id: number) {
  return request<MediaItem[]>(`${id}/recommendations`);
}

/** Personagens principais com o dublador japonês (pode vir vazio). */
export function getAnimeCast(id: number) {
  return request<CastMember[]>(`${id}/characters`);
}

/** Gêneros e temas do MyAnimeList (os IDs são os do próprio MAL). */
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
