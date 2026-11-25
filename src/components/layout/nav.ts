import { BookIcon, FilmIcon, HeartIcon, HomeIcon, SparklesIcon, TvIcon } from '../ui/Icons';

/** `short`: rótulo da barra inferior do celular, onde cada item tem ~1/6 da largura. */
export const NAV_ITEMS = [
  { href: '/', label: 'Início', short: 'Início', icon: HomeIcon },
  { href: '/movies', label: 'Filmes', short: 'Filmes', icon: FilmIcon },
  { href: '/series', label: 'Séries', short: 'Séries', icon: TvIcon },
  { href: '/animes', label: 'Animes', short: 'Animes', icon: SparklesIcon },
  { href: '/mangas', label: 'Mangás', short: 'Mangás', icon: BookIcon },
  { href: '/favorites', label: 'Minha lista', short: 'Lista', icon: HeartIcon },
] as const;
