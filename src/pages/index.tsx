import React from 'react';
import Head from 'next/head';
import Hero from '../components/Hero';
import MovieGrid from '../components/MovieGrid';
import AnimesSection from '../components/AnimesSection';



export default function Home() {
  return (
    <>
      <Head>
        <title>CineExplorer - Discover Movies and Series</title>
      </Head>
      <div style={{ maxWidth: '75rem', margin: '0 auto', padding: '1.5rem' }}>
        <Hero />
        <MovieGrid />
        {/* seção de animes (preview) */}
        <AnimesSection />
      </div>
    </>
  );
}