export type MediaType = 'movie' | 'tv' | 'anime' | 'manga';

/** Formato único usado pela interface para filmes, séries, animes e mangás. */
export interface MediaItem {
  id: number;
  type: MediaType;
  title: string;
  poster: string | null;
  backdrop: string | null;
  year: string | null;
  rating: number | null;
  overview: string;
}

export interface CastMember {
  id: number;
  name: string;
  role: string;
  photo: string | null;
}

export interface Provider {
  name: string;
  logo: string | null;
  url?: string;
  /** Idioma do serviço, quando importa (ex.: MANGA Plus em português). */
  language?: string;
}

export interface MediaDetails extends MediaItem {
  originalTitle: string | null;
  tagline: string | null;
  genres: string[];
  facts: { label: string; value: string }[];
  cast: CastMember[];
  trailerKey: string | null;
  providers: Provider[];
  providersLink: string | null;
  externalUrl: string;
  externalLabel: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  hasMore: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export const TYPE_LABEL: Record<MediaType, string> = {
  movie: 'Filme',
  tv: 'Série',
  anime: 'Anime',
  manga: 'Mangá',
};
