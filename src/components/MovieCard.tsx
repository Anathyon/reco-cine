import React from 'react';
import { Movie, Series } from '../types';
import { getImageUrl } from '../api/tmdb';

interface Props {
  item: Movie | Series;
  onClick?: () => void;
}

export default function MovieCard({ item, onClick }: Props) {
  const title = 'title' in item ? item.title : item.name;
  const date = 'release_date' in item ? item.release_date : item.first_air_date;
  const poster = getImageUrl(item.poster_path || '', 'w342');

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        border: '1px solid #374151',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        width: '100%',
        height: '270px',
        backgroundColor: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {poster ? (
          <img
            src={poster}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            loading="lazy"
          />
        ) : (
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Sem imagem
          </div>
        )}
      </div>
      
      <div style={{ padding: '1rem' }}>
        <h3 style={{
          margin: 0,
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#f9fafb',
          lineHeight: '1.25',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </h3>
        
        {date && (
          <p style={{
            margin: '0.25rem 0 0 0',
            fontSize: '0.75rem',
            color: '#9ca3af',
          }}>
            {new Date(date).getFullYear()}
          </p>
        )}
      </div>
    </div>
  );
}