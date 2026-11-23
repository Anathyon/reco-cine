import { useCallback } from 'react';
import { useRouter } from 'next/router';
import type { MediaItem, MediaType } from '../types';

// Indica se o modal atual foi aberto pelo app (e portanto pode ser fechado com "voltar").
let openedWithPush = false;

export function parseView(raw: unknown): { type: MediaType; id: number } | null {
  if (typeof raw !== 'string') return null;
  const match = raw.match(/^(movie|tv|anime)-(\d+)$/);
  return match ? { type: match[1] as MediaType, id: Number(match[2]) } : null;
}

/**
 * O modal de detalhes vive na URL (?view=movie-123): dá para compartilhar o
 * link, e o botão "voltar" do navegador/celular fecha o modal.
 */
export function useDetailsRoute() {
  const router = useRouter();
  const view = parseView(router.query.view);

  const open = useCallback(
    (item: Pick<MediaItem, 'type' | 'id'>) => {
      const url = { pathname: router.pathname, query: { ...router.query, view: `${item.type}-${item.id}` } };
      if (parseView(router.query.view)) {
        // Navegando de um modal para outro (recomendações): substitui o histórico.
        router.replace(url, undefined, { shallow: true, scroll: false });
      } else {
        openedWithPush = true;
        router.push(url, undefined, { shallow: true, scroll: false });
      }
    },
    [router],
  );

  const close = useCallback(() => {
    if (openedWithPush) {
      openedWithPush = false;
      router.back();
      return;
    }
    const { view: _view, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true, scroll: false });
  }, [router]);

  return { view, open, close };
}
