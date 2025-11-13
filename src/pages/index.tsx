import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Hero from '../components/Hero';
import MovieGrid from '../components/MovieGrid';
import AnimesSection from '../components/AnimesSection';
import MobileCatalog from '../components/MobileCatalog';
import MovieModal from '../components/MovieModal';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <Head>
        <title>CineExplorer - Discover Movies and Series</title>
      </Head>
      <MovieModal />
      {isMobile ? (
        <MobileCatalog />
      ) : (
        <div style={{ maxWidth: '75rem', margin: '0 auto', padding: '1.5rem' }}>
          <Hero />
          <MovieGrid />
          <AnimesSection />
        </div>
      )}
    </>
  );
}