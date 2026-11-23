import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDetailsRoute } from '../../hooks/useDetailsRoute';
import DetailsView from './DetailsView';
import { XIcon } from '../ui/Icons';

export default function DetailsModal() {
  const { view, close } = useDetailsRoute();
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = Boolean(view);
  const closeFn = useRef(close);
  closeFn.current = close;

  // Trava a rolagem da página, fecha com Esc e devolve o foco ao fechar.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeFn.current();
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  // Ao trocar de título pelas recomendações, volta ao topo.
  useEffect(() => {
    overlayRef.current?.scrollTo?.({ top: 0 });
  }, [view?.type, view?.id]);

  return (
    <AnimatePresence>
      {view && (
        <motion.div
          key="details-overlay"
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-black/75 backdrop-blur-sm sm:px-4 sm:py-10"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative mx-auto min-h-full w-full max-w-5xl overflow-hidden bg-ink-900 shadow-2xl ring-1 ring-white/10 sm:min-h-0 sm:rounded-3xl"
          >
            <button
              ref={closeRef}
              onClick={close}
              aria-label="Fechar detalhes"
              className="btn-icon absolute right-3 top-3 z-20 bg-black/60 sm:right-4 sm:top-4"
            >
              <XIcon size={20} />
            </button>
            <DetailsView key={`${view.type}-${view.id}`} type={view.type} id={view.id} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
