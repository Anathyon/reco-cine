import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Inter, Outfit } from 'next/font/google';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import Footer from '../components/layout/Footer';
import DetailsModal from '../components/media/DetailsModal';
import InstallPrompt from '../components/InstallPrompt';
import Toaster from '../components/ui/Toaster';
import { useFavoritesStore } from '../store/favoritesStore';
import { initAuth } from '../store/authStore';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const heroPage = router.pathname === '/';

  useEffect(() => {
    useFavoritesStore.persist.rehydrate();
    initAuth();

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Reco Cine — filmes, séries e animes</title>
        {/* Padrões; páginas sobrescrevem usando o mesmo `key`/`name`. */}
        <meta
          name="description"
          content="Descubra filmes, séries e animes, veja trailers, onde assistir no Brasil e monte a sua lista de favoritos."
        />
        <meta property="og:title" content="Reco Cine — filmes, séries e animes" key="og:title" />
        <meta
          property="og:description"
          content="Descubra o que assistir: tendências, recomendações, trailers e onde assistir no Brasil."
          key="og:description"
        />
        <meta property="og:image" content="/icon-512x512.png" key="og:image" />
        <meta property="og:type" content="website" key="og:type" />
      </Head>

      <div className={`${inter.variable} ${outfit.variable} flex min-h-screen flex-col font-sans`}>
        <Header transparent={heroPage} />
        <main id="conteudo" className={`flex-1 ${heroPage ? '' : 'pt-16'}`}>
          <Component {...pageProps} />
        </main>
        <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <Footer />
        </div>
        <BottomNav />
        <DetailsModal />
        <InstallPrompt />
        <Toaster />
      </div>
    </>
  );
}
