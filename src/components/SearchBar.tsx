import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (params: { query: string; genre: string; releaseYear: string; popularity: string }) => void;
}

const GENRES = [
  { value: '', label: 'Todos os Gêneros' },
  { value: 'action', label: 'Ação' },
  { value: 'comedy', label: 'Comédia' },
  { value: 'drama', label: 'Drama' },
  { value: 'horror', label: 'Terror' },
  { value: 'romance', label: 'Romance' },
];

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [popularity, setPopularity] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, genre, releaseYear, popularity });
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0f1724 0%, #1a2332 100%)', 
      borderRadius: '16px', 
      padding: '24px',
      border: '1px solid #2a3441',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <input
            type="text"
            placeholder="Busque por filmes, séries ou animes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #3a4553',
              background: '#0b1220',
              color: '#e6eef8',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#3a4553'}
          />
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '12px' 
        }}>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #3a4553',
              background: '#0b1220',
              color: '#e6eef8',
              fontSize: '14px',
              outline: 'none',
            }}
          >
            {GENRES.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          
          <input
            type="number"
            placeholder="Ano"
            value={releaseYear}
            onChange={(e) => setReleaseYear(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #3a4553',
              background: '#0b1220',
              color: '#e6eef8',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          
          <select
            value={popularity}
            onChange={(e) => setPopularity(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #3a4553',
              background: '#0b1220',
              color: '#e6eef8',
              fontSize: '14px',
              outline: 'none',
            }}
          >
            <option value="">Popularidade</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
          
          <button 
            type="submit" 
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔍 Buscar
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;