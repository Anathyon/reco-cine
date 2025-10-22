const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMG_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

if (!API_KEY) {
  console.warn('NEXT_PUBLIC_TMDB_API_KEY não está definida. Adicione-a em .env.local');
}

async function tmdbFetch(path: string, params = '') {
  const url = `${BASE}${path}?api_key=${API_KEY}${params ? `&${params}` : ''}&language=pt-BR`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => 'no body');
    throw new Error(`TMDB fetch error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchMovies(query: string) {
  // 'popular' -> /movie/popular, otherwise search movies
  if (query === 'popular') {
    return tmdbFetch('/movie/popular', 'page=1');
  }
  // allow passing 'tv:popular' or normal search string
  if (query.startsWith('tv:')) {
    const q = query.replace(/^tv:/, '');
    if (q === 'popular') return tmdbFetch('/tv/popular', 'page=1');
    return tmdbFetch('/search/tv', `query=${encodeURIComponent(q)}`);
  }
  // generic search
  return tmdbFetch('/search/movie', `query=${encodeURIComponent(query)}`);
}

export async function fetchMovieDetails(id: number, type: 'movie' | 'tv' = 'movie') {
  return tmdbFetch(`/${type}/${id}`);
}

export const getImageUrl = (path: string, size = 'w500') => {
  if (!path) return '';
  return `${IMG_BASE}/${size}${path}`;
};