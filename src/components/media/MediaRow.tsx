import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { MediaItem } from '../../types';
import { useInView } from '../../hooks/useInView';
import { useQuery } from '../../hooks/useQuery';
import MediaCard, { MediaCardSkeleton } from './MediaCard';
import { ErrorState } from '../ui/States';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons';

interface RowProps {
  title: ReactNode;
  href?: string;
  items?: MediaItem[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  showType?: boolean;
}

const CARD_WIDTH = 'w-[30%] min-w-[7.25rem] max-w-[10rem] sm:w-40 sm:max-w-none lg:w-44';

export function MediaRow({ title, href, items, loading, error, onRetry, showType }: RowProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  }, []);

  useEffect(updateEdges, [items, updateEdges]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!loading && !error && items && items.length === 0) return null;

  return (
    <section className="group/row relative">
      <div className="container-page mb-3 flex items-end justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-white sm:text-xl">{title}</h2>
        {href && (
          <Link
            href={href}
            className="-my-2 inline-flex shrink-0 items-center gap-0.5 py-2 text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            Ver tudo <ChevronRightIcon size={16} />
          </Link>
        )}
      </div>

      {error ? (
        <div className="container-page">
          <ErrorState message={error} onRetry={onRetry} compact />
        </div>
      ) : (
        <div className="row-frame relative">
          <div
            ref={scroller}
            onScroll={updateEdges}
            className="row-inset no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 pt-1 sm:gap-4"
          >
            {loading && !items?.length
              ? Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={`${CARD_WIDTH} shrink-0`}>
                    <MediaCardSkeleton />
                  </div>
                ))
              : items?.map((item) => (
                  <div key={`${item.type}-${item.id}`} className={`${CARD_WIDTH} shrink-0 snap-start`}>
                    <MediaCard item={item} showType={showType} />
                  </div>
                ))}
          </div>

          {!edges.start && (
            <button
              type="button"
              aria-label="Rolar para a esquerda"
              onClick={() => scrollBy(-1)}
              className="absolute left-2 top-[38%] hidden -translate-y-1/2 opacity-0 transition group-hover/row:opacity-100 md:flex btn-icon h-11 w-11 bg-ink-950/80 shadow-xl"
            >
              <ChevronLeftIcon size={22} />
            </button>
          )}
          {!edges.end && (
            <button
              type="button"
              aria-label="Rolar para a direita"
              onClick={() => scrollBy(1)}
              className="absolute right-2 top-[38%] hidden -translate-y-1/2 opacity-0 transition group-hover/row:opacity-100 md:flex btn-icon h-11 w-11 bg-ink-950/80 shadow-xl"
            >
              <ChevronRightIcon size={22} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/** Fileira que só busca os dados quando chega perto da tela. */
export function LazyMediaRow({
  queryKey,
  fetcher,
  initialItems,
  ...props
}: Omit<RowProps, 'items' | 'loading' | 'error' | 'onRetry'> & {
  queryKey: string;
  fetcher: () => Promise<MediaItem[]>;
  /** Itens renderizados no servidor: a fileira aparece já preenchida. */
  initialItems?: MediaItem[];
}) {
  const { ref, inView } = useInView<HTMLDivElement>('300px');
  const active = inView || Boolean(initialItems?.length);
  const { data, loading, error, retry } = useQuery(active ? queryKey : null, fetcher, {
    initialData: initialItems?.length ? initialItems : undefined,
  });

  return (
    <div ref={ref} className="min-h-[18rem]">
      <MediaRow {...props} items={data} loading={!active || loading} error={error} onRetry={retry} />
    </div>
  );
}
