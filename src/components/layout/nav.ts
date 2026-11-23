import { FilmIcon, HeartIcon, HomeIcon, SparklesIcon, TvIcon } from '../ui/Icons';

export const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: HomeIcon },
  { href: '/movies', label: 'Filmes', icon: FilmIcon },
  { href: '/series', label: 'Séries', icon: TvIcon },
  { href: '/animes', label: 'Animes', icon: SparklesIcon },
  { href: '/favorites', label: 'Minha lista', icon: HeartIcon },
] as const;
