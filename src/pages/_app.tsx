import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Header from '../components/layout/Header';
import { AnimatePresence } from 'framer-motion';
import Footer from '../components/layout/Footer';
import InstallPWA from '../components/InstallPWA';
import { useEffect } from 'react';
import Head from 'next/head';

export default function App({ Component, pageProps, router }: AppProps) {
  useEffect(() => {
    // Registrar Service Worker apenas em produção
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          console.log('SW registered: ', registration);
        } catch (error) {
          console.log('SW registration failed: ', error);
        }
      };
      
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="theme-color" content="#071226" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </Head>
      <Header />
      <main
        className="min-h-screen min-w-full bg-linear-to-b from-[#071226] to-[#0e1a28] text-slate-100"
        style={{ minHeight: '100vh', minWidth: '100%' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
      </main>
      <Footer />
      <InstallPWA />
    </>
  );
}
