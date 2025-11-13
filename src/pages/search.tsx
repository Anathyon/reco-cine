import React, { useState } from 'react';
import { Movie } from '../types';
import { fetchMovies } from '../api/tmdb';
import { searchAnimes, AnimeSearchResult } from '../api/jikan';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import AnimeModal from '../components/AnimeModal';
import { useModalStore } from '../store/modalStore';

export default function SearchPage() {
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [animeResults, setAnimeResults] = useState<AnimeSearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv' | 'animes'>('movies');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [isAnimeModalOpen, setIsAnimeModalOpen] = useState(false);
  const { openModal } = useModalStore();

  const handleSearch = async (params: { query: string; genre: string; releaseYear: string; popularity: string }) => {
    if (!params.query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'movies') {
        const data = await fetchMovies(params.query);
        setMovieResults(data.results || []);
        setAnimeResults([]);
      } else if (activeTab === 'tv') {
        const data = await fetchMovies(`tv:${params.query}`);
        setMovieResults(data.results || []);
        setAnimeResults([]);
      } else {
        const animes = await searchAnimes(params.query);
        setAnimeResults(animes);
        setMovieResults([]);
      }
    } catch {
      setError('Erro ao buscar');
    } finally {
      setLoading(false);
    }
  };

  const openAnimeModal = (animeId: number) => {
    setSelectedAnimeId(animeId);
    setIsAnimeModalOpen(true);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <MovieModal />
      <AnimeModal 
        isOpen={isAnimeModalOpen} 
        animeId={selectedAnimeId} 
        onClose={() => setIsAnimeModalOpen(false)} 
      />
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Buscar</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>Encontre filmes, séries e animes</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button 
          onClick={() => setActiveTab('movies')}
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'movies' ? '#3b82f6' : '#1e293b', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}
        >
          Filmes
        </button>
        <button 
          onClick={() => setActiveTab('tv')}
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'tv' ? '#3b82f6' : '#1e293b', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}
        >
          Séries
        </button>
        <button 
          onClick={() => setActiveTab('animes')}
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'animes' ? '#3b82f6' : '#1e293b', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6, 
            cursor: 'pointer' 
          }}
        >
          Animes
        </button>
      </div>

      <SearchBar onSearch={handleSearch} />

      {loading && <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Buscando...</div>}
      {error && <div style={{ padding: 48, textAlign: 'center', color: 'salmon' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
        {activeTab === 'movies' ? (
          movieResults.map((item) => (
            <MovieCard 
              key={item.id} 
              item={item} 
              onClick={() => openModal(item.id, 'movie')} 
            />
          ))
        ) : activeTab === 'tv' ? (
          movieResults.map((item) => (
            <MovieCard 
              key={item.id} 
              item={item} 
              onClick={() => openModal(item.id, 'tv')} 
            />
          ))
        ) : (
          animeResults.map((anime) => (
            <div 
              key={anime.mal_id}
              onClick={() => openAnimeModal(anime.mal_id)}
              style={{ 
                background: '#0f1724', 
                borderRadius: 8, 
                overflow: 'hidden', 
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
            >
              <div style={{ height: 270, background: '#0b1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {anime.images?.jpg?.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={anime.images.jpg.image_url} 
                    alt={anime.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ color: '#94a3b8' }}>Sem imagem</div>
                )}
              </div>
              <div style={{ padding: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e6eef8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {anime.title}
                </h3>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>
                  {anime.score ? `⭐ ${anime.score}` : 'Sem nota'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}