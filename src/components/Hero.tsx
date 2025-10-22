// filepath: c:\Users\ANATHYON ERYSSON\Downloads\Reconmendações-cine\reco-cine\src\components\Hero.tsx
import React from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="w-full" style={{ width: '100%', paddingTop: 80, paddingBottom: 80 }}>
      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center text-5xl md:text-7xl font-extrabold leading-tight"
      >
        <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-purple-500 to-pink-500">
          Explore o Mundo do
        </span>
        <br />
        <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-400 via-pink-500 to-red-400">
          Cinema
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-slate-300 max-w-2xl mx-auto"
        style={{ marginTop: 24, textAlign: 'center', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}
      >
        Descubra filmes e séries incríveis, acompanhe suas avaliações e crie sua lista de favoritos
      </motion.p>
    </section>
  );
}