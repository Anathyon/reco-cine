import React from 'react';
import Head from 'next/head';
import Hero from '../components/Hero';
import MovieGrid from '../components/MovieGrid';
import AnimesSection from '../components/AnimesSection';

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/Movies', label: 'Filmes' },
  { href: '/Series', label: 'Séries' },
  { href: '/animes', label: 'Animes' },
  { href: '/search', label: 'Buscar' },
  { href: '/Favorites', label: 'Favoritos' },
];

export default function Home() {
  return (
    <>
      <Head>
        <title>CineExplorer - Discover Movies and Series</title>
      </Head>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <Hero />
        <MovieGrid />
        {/* seção de animes (preview) */}
        <AnimesSection />
      </div>
    </>
  );
}