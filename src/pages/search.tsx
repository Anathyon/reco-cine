import React, { useState } from 'react';
import { Movie } from '../types';
import { fetchMovies } from '../api/tmdb';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { useModalStore } from '../store/modalStore';

export default function SearchPage() {
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { openModal } = useModalStore();

  const handleSearch = async (params: { query: string; genre: string; releaseYear: string; popularity: string }) => {
    if (!params.query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMovies(params.query);
      setResults(data.results || []);
    } catch (err) {
      setError('Erro ao buscar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <MovieModal />
      
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Buscar</h1>
        <p style={{ color: '#94a3b8', marginTop: 6 }}>Encontre filmes e séries</p>
      </div>

      <SearchBar onSearch={handleSearch} />

      {loading && <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Buscando...</div>}
      {error && <div style={{ padding: 48, textAlign: 'center', color: 'salmon' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
        {results.map((item) => (
          <MovieCard 
            key={item.id} 
            item={item} 
            type="movie" 
            onClick={() => openModal(item.id, 'movie')} 
          />
        ))}
      </div>
    </div>
  );
}