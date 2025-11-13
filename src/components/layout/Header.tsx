import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/', label: 'Início' },
  { href: '/movies', label: 'Filmes' },
  { href: '/series', label: 'Séries' },
  { href: '/animes', label: 'Animes' },
  { href: '/search', label: 'Buscar' },
  { href: '/favorites', label: 'Favoritos' },
];

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4rem',
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                🎬
              </div>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#f1f5f9',
              }}>
                Reco Cine
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav style={{ display: 'none' }} className="desktop-nav">
            <div style={{ display: 'flex', gap: '1rem' }}>
              {NAV_ITEMS.map(item => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      color: isActive ? '#f1f5f9' : '#cbd5e1',
                      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'block',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              backgroundColor: '#1e293b',
              border: 'none',
              color: '#cbd5e1',
              cursor: 'pointer',
            }}
            className="mobile-menu-btn"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '4rem',
            left: 0,
            right: 0,
            backgroundColor: '#0f172a',
            borderBottom: '1px solid #334155',
            zIndex: 40,
            padding: '1rem',
          }}
          className="mobile-menu"
        >
          <nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {NAV_ITEMS.map(item => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.375rem',
                      color: isActive ? '#f1f5f9' : '#cbd5e1',
                      backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: block !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}