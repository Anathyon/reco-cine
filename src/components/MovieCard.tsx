import React from 'react';
import { Movie, Series } from '../types';
import { getImageUrl } from '../api/tmdb';
import { motion } from 'framer-motion';

type Props = {
  item: Movie | Series;
  type?: 'movie' | 'tv';
  onClick?: () => void;
};

export default function MovieCard({ item, onClick }: Props) {
  const poster = getImageUrl(item.poster_path || '', 'w342');

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      style={{
        backgroundColor: '#0f1724',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer',
        width: '100%',
        maxWidth: '11.25rem',
        minWidth: '8rem',
        boxShadow: '0 6px 18px rgba(2,6,23,0.6)',
      }}
    >
      <div style={{ 
        height: 'clamp(12rem, 20vw, 16.875rem)', 
        backgroundColor: '#0b1220', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={poster} 
            alt={'title' in item ? item.title : item.name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              display: 'block' 
            }} 
          />
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>Sem imagem</div>
        )}
      </div>

      <div style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        <h3 style={{ 
          fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', 
          fontWeight: 700, 
          color: '#e6eef8', 
          margin: 0, 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          lineHeight: 1.2
        }}>
          {'title' in item ? item.title : item.name}
        </h3>
        <p style={{ 
          fontSize: 'clamp(0.625rem, 2vw, 0.75rem)', 
          color: '#94a3b8', 
          marginTop: 'clamp(0.25rem, 1vw, 0.375rem)',
          margin: 'clamp(0.25rem, 1vw, 0.375rem) 0 0 0'
        }}>
          {'release_date' in item ? item.release_date : item.first_air_date}
        </p>
      </div>
    </motion.div>
  );
}