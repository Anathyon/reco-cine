import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaItem, Page } from '../types';
import { uniqueBy } from '../lib/format';
import { errorMessage } from './useQuery';

interface ListState {
  items: MediaItem[];
  page: number;
  hasMore: boolean;
}

// Mantém a lista carregada ao navegar entre páginas e voltar.
const listCache = new Map<string, ListState>();

export function useInfiniteList(key: string | null, fetchPage: (page: number) => Promise<Page<MediaItem>>) {
  const [list, setList] = useState<ListState>(() => (key && listCache.get(key)) || { items: [], page: 0, hasMore: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const requestId = useRef(0);
  const listRef = useRef(list);
  listRef.current = list;
  const loadingRef = useRef(false);

  const load = useCallback(
    async (page: number, base: ListState) => {
      if (!key) return;
      const id = ++requestId.current;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchRef.current(page);
        if (id !== requestId.current) return;
        const next: ListState = {
          items: uniqueBy([...base.items, ...result.items], (i) => `${i.type}-${i.id}`),
          page: result.page,
          hasMore: result.hasMore && result.items.length > 0,
        };
        listCache.set(key, next);
        setList(next);
      } catch (err) {
        if (id === requestId.current) setError(errorMessage(err));
      } finally {
        if (id === requestId.current) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    },
    [key],
  );

  useEffect(() => {
    if (!key) return;
    const cached = listCache.get(key);
    if (cached) {
      requestId.current++;
      loadingRef.current = false;
      setList(cached);
      setLoading(false);
      setError(null);
      return;
    }
    const empty = { items: [], page: 0, hasMore: true };
    setList(empty);
    load(1, empty);
  }, [key, load]);

  const loadMore = useCallback(() => {
    const current = listRef.current;
    if (loadingRef.current || !current.hasMore) return;
    load(current.page + 1, current);
  }, [load]);

  const retry = useCallback(() => {
    const current = listRef.current;
    load(current.page + 1, current);
  }, [load]);

  return { ...list, loading, error, loadMore, retry };
}
