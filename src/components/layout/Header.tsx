import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

const navItems = [
  { href: '/', label: 'Início' },
  { href: '/movies', label: 'Filmes' },
  { href: '/series', label: 'Séries' },
  { href: '/animes', label: 'Animes' }, // substituído Tendências -> Animes
  { href: '/search', label: 'Buscar' },
  { href: '/favorites', label: 'Favoritos' },
];

export default function Header() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120 }}
        className="w-full bg-[rgba(4,8,15,0.6)] backdrop-blur-sm border-b border-slate-800"
        style={{ width: '100%', position: 'relative' }}
      >
        <div
          style={{
            maxWidth: 1120,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 12,
            paddingBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg,#3b82f6,#ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                }}
              >
                🎞
              </div>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#e6eef8' }}>CineExplorer</span>
            </Link>
          </div>

          {/* desktop nav */}
          <nav
            aria-label="main navigation"
            style={{ display: 'none' }}
            className="desktop-nav"
          >
            {/* kept className for possible desktop media rule, but default hidden via inline style */}
            <div style={{ display: 'flex', gap: 20 }}>
              {navItems.map((item) => {
                const active = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      color: active ? '#fff' : '#cbd5e1',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: active ? 'rgba(255,255,255,0.03)' : 'transparent',
                      textDecoration: 'none',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* mobile actions */}
          <div className="mobile-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                if (router.pathname !== '/search') {
                  router.push('/search');
                }
              }}
              aria-label="Abrir busca"
              style={{
                width: 40,
                height: 40,
                borderRadius: 9999,
                background: '#0b1220',
                color: '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔍
            </button>

            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: '#0b1220',
                color: '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ☰
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile sidebar */}
      {open && (
        <motion.aside
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', stiffness: 200 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: 280,
            background: '#071226',
            zIndex: 60,
            padding: 20,
            boxShadow: '2px 0 12px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg,#3b82f6,#ec4899)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🎞
              </div>
              <strong style={{ color: '#e6eef8' }}>CineExplorer</strong>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} style={{ color: '#e6eef8', textDecoration: 'none', padding: '8px 10px', borderRadius: 6 }}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: 'auto' }}>
            <small style={{ color: '#94a3b8' }}>© 2025 CineExplorer</small>
          </div>

          {/* backdrop to close */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              left: 280,
              background: 'rgba(0,0,0,0.4)',
            }}
          />
        </motion.aside>
      )}

      <style jsx>{`
        /* show desktop nav on wider screens (>=576px) and hide mobile actions there */
        @media (min-width: 576px) {
          .desktop-nav { display: block !important; }
          .mobile-actions { display: none !important; }
        }
      `}</style>
    </>
  );
}