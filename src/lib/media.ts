import type { CastMember, MediaDetails, MediaItem, MediaType } from '../types';
import { getAnimeCast, getAnimeDetails, getAnimeRecommendations } from './anime';
import { getMangaDetails, getMangaRecommendations } from './manga';
import { getRecommendations, getTmdbDetails } from './tmdb';

/** Ponto único para buscar detalhes, independente da origem (TMDB ou MyAnimeList). */
export function getDetails(type: MediaType, id: number): Promise<MediaDetails> {
  if (type === 'anime') return getAnimeDetails(id);
  if (type === 'manga') return getMangaDetails(id);
  return getTmdbDetails(type, id);
}

export function getSimilar(type: MediaType, id: number): Promise<MediaItem[]> {
  if (type === 'anime') return getAnimeRecommendations(id);
  if (type === 'manga') return getMangaRecommendations(id);
  return getRecommendations(type, id);
}

/** Animes e mangás vêm do MyAnimeList (textos em inglês, sem elenco do TMDB). */
export const isMalType = (type: MediaType): type is 'anime' | 'manga' => type === 'anime' || type === 'manga';

/** Animes têm elenco numa chamada separada; filmes/séries já vêm com os detalhes. */
export function getAnimeCharacters(id: number): Promise<CastMember[]> {
  return getAnimeCast(id);
}

export const mediaKey = (item: Pick<MediaItem, 'type' | 'id'>) => `${item.type}-${item.id}`;

/** URL da página própria do título (compartilhável e indexável). */
export const titleHref = (item: Pick<MediaItem, 'type' | 'id'>) => `/title/${item.type}/${item.id}`;

export const isMediaType = (value: unknown): value is MediaType =>
  value === 'movie' || value === 'tv' || value === 'anime' || value === 'manga';
