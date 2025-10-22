export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  vote_average: number;
  poster_path: string;
  genre_ids: number[];
}

export interface Series {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  poster_path: string;
  genre_ids: number[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Favorite {
  id: number;
  type: 'movie' | 'series';
}