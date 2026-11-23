import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MediaItem } from '../../types';
import { TYPE_LABEL } from '../../types';
import { formatRating, ratingColor } from '../../lib/format';
import { useDetailsRoute } from '../../hooks/useDetailsRoute';
import FavoriteButton from './FavoriteButton';
import { ErrorState } from '../ui/States';
import { InfoIcon, StarIcon } from '../ui/Icons';

const ROTATE_MS = 8000;

interface Props {
  items?: MediaItem[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function HeroBanner({ items = [], loading, error, onRetry }: Props) {
  const { open } = useDetailsRoute();
  const slides = items.filter((i) => i.backdrop && i.overview).slice(0, 6);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  if (error) {
    return (
      <div className="container-page pb-8 pt-24">
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  const current = slides[index % Math.max(slides.length, 1)];

  return (
    <section
      className="relative h-[72svh] min-h-[30rem] w-full overflow-hidden sm:h-[78vh] sm:max-h-[48rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Destaques da semana"
    >
      {loading || !current ? (
        <div className="skeleton absolute inset-0" />
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.backdrop!} alt="" className="h-full w-full object-cover object-top" />
          </motion.div>
        </AnimatePresence>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-ink-950/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/40 to-transparent" />

      <div className="container-page relative flex h-full flex-col justify-end pb-14 sm:pb-20">
        {current && !loading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45 }}
              className="max-w-2xl"
            >
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-zinc-300">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                  {TYPE_LABEL[current.type]}
                </span>
                {formatRating(current.rating) && (
                  <span className="inline-flex items-center gap-1">
                    <StarIcon size={14} className={ratingColor(current.rating)} />
                    {formatRating(current.rating)}
                  </span>
                )}
                {current.year && <span>{current.year}</span>}
              </div>
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
                {current.title}
              </h1>
              <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">{current.overview}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => open(current)} className="btn-primary px-6 py-3">
                  <InfoIcon size={18} />
                  Ver detalhes
                </button>
                <FavoriteButton item={current} className="px-6 py-3" />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {slides.length > 1 && (
          <div className="mt-8 flex gap-2" role="tablist" aria-label="Escolher destaque">
            {slides.map((s, i) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={i === index}
                aria-label={`Destaque ${i + 1}: ${s.title}`}
                onClick={() => setIndex(i)}
                className="group/dot py-2"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-500 ${
                    i === index ? 'w-8 bg-white' : 'w-4 bg-white/30 group-hover/dot:bg-white/60'
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
