const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const IMG_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

function getMockData(path: string) {
  const mockMovies = {
    results: [
      { id: 1, title: 'Filme Exemplo 1', overview: 'Descrição do filme', release_date: '2024-01-01', vote_average: 8.5, poster_path: '/example1.jpg', genre_ids: [28, 35] },
      { id: 2, title: 'Filme Exemplo 2', overview: 'Descrição do filme', release_date: '2024-01-02', vote_average: 7.8, poster_path: '/example2.jpg', genre_ids: [18] }
    ]
  };
  const mockSeries = {
    results: [
      { id: 1, name: 'Série Exemplo 1', overview: 'Descrição da série', first_air_date: '2024-01-01', vote_average: 9.0, poster_path: '/series1.jpg', genre_ids: [18, 10759] }
    ]
  };
  return path.includes('/tv/') ? mockSeries : mockMovies;
}



async function tmdbFetch(path: string, params = '') {
  if (!API_KEY) {
    console.warn('API Key do TMDB não configurada, usando dados mock');
    return getMockData(path);
  }
  
  const url = `${BASE}${path}?api_key=${API_KEY}${params ? `&${params}` : ''}&language=pt-BR`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'force-cache'
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => 'no body');
      throw new Error(`TMDB fetch error: ${res.status} ${text}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Erro na requisição TMDB:', error);
    throw error;
  }
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