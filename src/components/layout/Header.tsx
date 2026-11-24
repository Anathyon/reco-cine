import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useFavoritesStore } from '../../store/favoritesStore';
import { LogoMark, SearchIcon } from '../ui/Icons';
import { NAV_ITEMS } from './nav';
import AccountButton from './AccountButton';

export default function Header({ transparent }: { transparent?: boolean }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const favoritesCount = useFavoritesStore((s) => Object.keys(s.items).length);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = !transparent || scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'border-b border-white/5 bg-ink-950/85 backdrop-blur-xl' : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn-primary">
        Pular para o conteúdo
      </a>
      <div className="container-page flex h-16 items-center gap-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="Reco Cine — página inicial">
          <LogoMark size={32} />
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Reco<span className="text-brand-300">Cine</span>
          </span>
        </Link>

        <nav className="hidden flex-1 md:block" aria-label="Principal">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = router.pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition ${
                      active ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                    {href === '/favorites' && favoritesCount > 0 && (
                      <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {favoritesCount}
                      </span>
                    )}
                    {active && <span className="absolute inset-x-3.5 -bottom-[1px] h-0.5 rounded-full bg-brand-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            href="/search"
            aria-label="Buscar"
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-300 transition hover:text-white md:w-56 md:border md:border-white/10 md:bg-white/5 md:hover:bg-white/10 ${
              router.pathname === '/search' ? 'text-white md:border-white/25' : ''
            }`}
          >
            <SearchIcon size={20} />
            <span className="hidden md:inline">Buscar títulos…</span>
          </Link>
          <AccountButton />
        </div>
      </div>
    </header>
  );
}
