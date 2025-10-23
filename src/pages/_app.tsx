import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Header from '../components/layout/Header';
import { AnimatePresence } from 'framer-motion';
import Footer from '@/components/layout/Footer';

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <>
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
    </>
  );
}
