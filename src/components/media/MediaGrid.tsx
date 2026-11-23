import { useEffect, useRef } from 'react';
import type { MediaItem } from '../../types';
import MediaCard, { MediaCardSkeleton } from './MediaCard';
import { ErrorState } from '../ui/States';

interface Props {
  items: MediaItem[];
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
  showType?: boolean;
  skeletonCount?: number;
}

export const GRID_CLASS = 'grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7';

export default function MediaGrid({
  items,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  showType,
  skeletonCount = 14,
}: Props) {
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;

  // Rolagem infinita: carrega a próxima página quando o fim da grade se aproxima.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore || error || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMoreRef.current?.(), {
      rootMargin: '800px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, error, items.length]);

  return (
    <div>
      <div className={GRID_CLASS}>
        {items.map((item, i) => (
          <MediaCard key={`${item.type}-${item.id}`} item={item} showType={showType} priority={i < 7} />
        ))}
        {loading && Array.from({ length: items.length ? 7 : skeletonCount }, (_, i) => <MediaCardSkeleton key={`s${i}`} />)}
      </div>

      {error && (
        <div className="mt-8">
          <ErrorState message={error} onRetry={onRetry} compact />
        </div>
      )}

      {hasMore && !loading && !error && items.length > 0 && onLoadMore && (
        <div ref={sentinel} className="mt-10 flex justify-center">
          <button onClick={onLoadMore} className="btn-ghost">
            Carregar mais
          </button>
        </div>
      )}
    </div>
  );
}
