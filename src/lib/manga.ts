/*
 * Cliente de mangás usado pelo navegador (rota /api/manga → API oficial do MyAnimeList).
 */
import type { Genre, MediaDetails, MediaItem, Page } from '../types';
import { malRequest } from './anime';

export type MangaSort = 'popular' | 'top';

export function discoverManga(opts: { genre?: number; sort?: MangaSort; page?: number }) {
  return malRequest<Page<MediaItem>>('manga', 'discover', { page: opts.page ?? 1, genre: opts.genre, sort: opts.sort });
}

/** `adult`: inclui títulos +18 (o servidor confere login e idade). */
export function searchManga(query: string, page = 1, signal?: AbortSignal, adult = false) {
  return malRequest<Page<MediaItem>>('manga', 'search', { q: query, page }, signal, adult);
}

export function getMangaDetails(id: number) {
  return malRequest<MediaDetails>('manga', String(id));
}

export function getMangaRecommendations(id: number) {
  return malRequest<MediaItem[]>('manga', `${id}/recommendations`);
}

/** Gêneros e demografias de mangá do MyAnimeList (IDs conferidos na API: diferem dos de anime). */
export const MANGA_GENRES: Genre[] = [
  { id: 1, name: 'Ação' },
  { id: 2, name: 'Aventura' },
  { id: 4, name: 'Comédia' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasia' },
  { id: 62, name: 'Isekai' },
  { id: 22, name: 'Romance' },
  { id: 36, name: 'Slice of life' },
  { id: 30, name: 'Esportes' },
  { id: 37, name: 'Sobrenatural' },
  { id: 7, name: 'Mistério' },
  { id: 45, name: 'Suspense' },
  { id: 40, name: 'Psicológico' },
  { id: 14, name: 'Terror' },
  { id: 24, name: 'Ficção científica' },
  { id: 27, name: 'Shounen' },
  { id: 41, name: 'Seinen' },
  { id: 25, name: 'Shoujo' },
];
