import { memo } from 'react';
import type { MediaItem } from '../../types';
import { TYPE_LABEL } from '../../types';
import { formatRating, ratingColor } from '../../lib/format';
import { useDetailsRoute } from '../../hooks/useDetailsRoute';
import { titleHref } from '../../lib/media';
import { useIsFavorite } from '../../store/favoritesStore';
import FavoriteButton from './FavoriteButton';
import Poster from './Poster';
import { StarIcon } from '../ui/Icons';

interface Props {
  item: MediaItem;
  showType?: boolean;
  priority?: boolean;
}

function MediaCard({ item, showType, priority }: Props) {
  const { open } = useDetailsRoute();
  const isFavorite = useIsFavorite(item);
  const rating = formatRating(item.rating);

  return (
    <article className="group relative">
      <a
        href={titleHref(item)}
        onClick={(e) => {
          // Ctrl/Cmd/Shift/botão do meio: deixa o navegador abrir a página do título.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          open(item);
        }}
        className="block w-full rounded-xl text-left"
        aria-label={`${item.title}${item.year ? ` (${item.year})` : ''} — ver detalhes`}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-800 shadow-lg shadow-black/30 ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-white/20">
          <Poster
            src={item.poster}
            alt={item.title}
            priority={priority}
            className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {rating && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
              <StarIcon size={11} className={ratingColor(item.rating)} />
              {rating}
            </span>
          )}
        </div>
        <h3 className="mt-2.5 line-clamp-1 text-sm font-medium text-zinc-100 transition-colors group-hover:text-white">
          {item.title}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          {[item.year, showType ? TYPE_LABEL[item.type] : null].filter(Boolean).join(' · ') || ' '}
        </p>
      </a>

      <FavoriteButton
        item={item}
        variant="card"
        className={`absolute right-2 top-2 ${
          isFavorite ? '' : 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100'
        }`}
      />
    </article>
  );
}

export default memo(MediaCard);

export function MediaCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[2/3] rounded-xl" />
      <div className="skeleton mt-2.5 h-3.5 w-4/5 rounded" />
      <div className="skeleton mt-1.5 h-3 w-1/3 rounded" />
    </div>
  );
}
