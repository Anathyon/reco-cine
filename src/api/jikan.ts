const BASE_URL = process.env.NEXT_PUBLIC_JIKAN_BASE_URL || 'https://api.jikan.moe/v4';

export interface AnimeSearchResult {
  mal_id: number;
  title: string;
  images?: {
    jpg?: {
      image_url: string;
    };
  };
  score?: number;
  year?: number;
  genres?: { name: string }[];
  synopsis?: string;
}

export async function searchAnimes(query: string): Promise<AnimeSearchResult[]> {
  try {
    const response = await fetch(`${BASE_URL}/anime?q=${encodeURIComponent(query)}&limit=20`);
    if (!response.ok) throw new Error('Erro na busca');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro ao buscar animes:', error);
    return [];
  }
}

export async function getAnimeDetails(id: number) {
  try {
    const response = await fetch(`${BASE_URL}/anime/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar detalhes');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes do anime:', error);
    return null;
  }
}