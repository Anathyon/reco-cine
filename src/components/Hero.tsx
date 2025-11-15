import React from 'react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section style={{ width: '100%', paddingTop: 80, paddingBottom: 80 }}>
      <motion.h1
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          fontSize: '4rem',
          fontWeight: 'bold',
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, #60a5fa, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        Explore o Mundo do Cinema
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          marginTop: 24,
          textAlign: 'center',
          maxWidth: 720,
          marginLeft: 'auto',
          marginRight: 'auto',
          color: '#cbd5e1',
          fontSize: '1.125rem'
        }}
      >
        Descubra filmes e séries incríveis, acompanhe suas avaliações e crie sua lista de favoritos
      </motion.p>
    </section>
  );
}