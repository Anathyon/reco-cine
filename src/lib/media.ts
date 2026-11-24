import type { CastMember, MediaDetails, MediaItem, MediaType } from '../types';
import { getAnimeCast, getAnimeDetails, getAnimeRecommendations } from './anime';
import { getRecommendations, getTmdbDetails } from './tmdb';

/** Ponto único para buscar detalhes, independente da origem (TMDB ou MyAnimeList). */
export function getDetails(type: MediaType, id: number): Promise<MediaDetails> {
  return type === 'anime' ? getAnimeDetails(id) : getTmdbDetails(type, id);
}

export function getSimilar(type: MediaType, id: number): Promise<MediaItem[]> {
  return type === 'anime' ? getAnimeRecommendations(id) : getRecommendations(type, id);
}

/** Animes têm elenco numa chamada separada; filmes/séries já vêm com os detalhes. */
export function getAnimeCharacters(id: number): Promise<CastMember[]> {
  return getAnimeCast(id);
}

export const mediaKey = (item: Pick<MediaItem, 'type' | 'id'>) => `${item.type}-${item.id}`;

/** URL da página própria do título (compartilhável e indexável). */
export const titleHref = (item: Pick<MediaItem, 'type' | 'id'>) => `/title/${item.type}/${item.id}`;

export const isMediaType = (value: unknown): value is MediaType => value === 'movie' || value === 'tv' || value === 'anime';
