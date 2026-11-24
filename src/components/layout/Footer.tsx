import Link from 'next/link';
import { LogoMark } from '../ui/Icons';
import { NAV_ITEMS } from './nav';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-ink-900/60">
      <div className="container-page flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="font-display text-base font-bold text-white">
              Reco<span className="text-brand-300">Cine</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-zinc-400">
            Descubra filmes, séries e animes, veja onde assistir e monte a sua lista.
          </p>
        </div>

        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[...NAV_ITEMS, { href: '/search', label: 'Buscar' }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-block py-1.5 text-zinc-400 transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/5">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Reco Cine</p>
          <p>
            Dados de filmes e séries por{' '}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">
              TMDB
            </a>{' '}
            e de animes por{' '}
            <a href="https://myanimelist.net" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white">
              MyAnimeList
            </a>
            . Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
