import React, { useState, useEffect } from 'react';
import { fetchMovies } from '../api/tmdb';
import { searchAnimes } from '../api/jikan';
import { Movie } from '../types';
import { useModalStore } from '../store/modalStore';

interface AnimeResult {
  mal_id: number;
  title: string;
  images?: { jpg?: { image_url?: string } };
}

export default function MobileCatalog() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Movie[]>([]);
  const [animes, setAnimes] = useState<AnimeResult[]>([]);
  const { openModal } = useModalStore();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [moviesData, seriesData, animesData] = await Promise.all([
          fetchMovies('popular'),
          fetchMovies('tv:popular'),
          searchAnimes('popular')
        ]);
        
        setMovies(moviesData.results?.slice(0, 10) || []);
        setSeries(seriesData.results?.slice(0, 10) || []);
        setAnimes(animesData.slice(0, 10) || []);
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
      }
    };

    loadContent();
  }, []);

  const renderSection = (title: string, items: any[], type: 'movie' | 'tv' | 'anime') => (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: 'bold', 
        marginBottom: '1rem',
        color: '#fff'
      }}>
        {title}
      </h2>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {items.map((item) => (
          <div
            key={type === 'anime' ? item.mal_id : item.id}
            onClick={() => {
              if (type === 'anime') {
                // Handle anime click
              } else {
                openModal(item.id, type);
              }
            }}
            style={{
              minWidth: '120px',
              width: '120px',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#1f2937'
            }}>
              <img
                src={
                  type === 'anime' 
                    ? item.images?.jpg?.image_url || ''
                    : `https://image.tmdb.org/t/p/w300${item.poster_path}`
                }
                alt={type === 'anime' ? item.title : (item.title || item.name)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                loading="lazy"
              />
            </div>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#fff',
              marginTop: '0.5rem',
              lineHeight: '1.2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {type === 'anime' ? item.title : (item.title || item.name)}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '1rem' }}>
      {renderSection('Filmes Populares', movies, 'movie')}
      {renderSection('Séries Premiadas', series, 'tv')}
      {renderSection('Anime Japonês', animes, 'anime')}
    </div>
  );
}