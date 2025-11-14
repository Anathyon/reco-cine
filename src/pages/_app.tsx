import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import InstallPWA from '../components/InstallPWA';
import Head from 'next/head';
import { useEffect } from 'react';
import { testPWAFeatures } from '../utils/pwaTest';
import { debugPWA } from '../utils/pwaDebug';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    }
    
    // Test PWA features after SW registration
    setTimeout(async () => {
      await testPWAFeatures();
      await debugPWA();
    }, 2000);
  }, []);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <title>Reco Cine</title>
      </Head>
      
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f1f5f9',
      }}>
        <Header />
        <main>
          <Component {...pageProps} />
        </main>
        <Footer />
        <InstallPWA />
      </div>
    </>
  );
}