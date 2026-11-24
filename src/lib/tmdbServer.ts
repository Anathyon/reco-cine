/*
 * Acesso direto ao TMDB, SOMENTE no servidor (rota de API e getStaticProps).
 * Nunca importe este arquivo em componentes: ele lê a chave da API.
 */
import type { MediaDetails, MediaItem } from '../types';
import {
  DETAILS_PARAMS,
  normalizePage,
  normalizeTmdbDetails,
  toSearchParams,
  trendingPath,
  type Params,
  type TmdbType,
} from './tmdb';

/** Rotas do TMDB que o proxy aceita repassar. */
export const ALLOWED_PATH = /^(movie|tv|person|trending|search|discover|genre|watch)(\/[\w-]+)*$/;

export const tmdbApiKey = () => process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || '';

const baseUrl = () =>
  (process.env.TMDB_BASE_URL || process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/$/, '');

export function upstreamUrl(path: string, params: Params): string {
  const search = toSearchParams(params);
  search.delete('api_key');
  search.set('api_key', tmdbApiKey());
  if (!search.has('language')) search.set('language', 'pt-BR');
  return `${baseUrl()}/${path}?${search}`;
}

export async function tmdbServer<T = any>(path: string, params: Params = {}, timeoutMs = 8000): Promise<T> {
  if (!tmdbApiKey()) throw new Error('Chave do TMDB não configurada no servidor');
  const res = await fetch(upstreamUrl(path, params), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw Object.assign(new Error(`TMDB respondeu ${res.status}`), { status: res.status });
  return res.json();
}

export async function getTrendingServer(type: TmdbType | 'all', window: 'day' | 'week'): Promise<MediaItem[]> {
  const data = await tmdbServer(trendingPath(type, window));
  return normalizePage(data, type === 'all' ? undefined : type).items;
}

export async function getTmdbDetailsServer(type: TmdbType, id: number): Promise<MediaDetails> {
  return normalizeTmdbDetails(type, id, await tmdbServer(`${type}/${id}`, DETAILS_PARAMS));
}
