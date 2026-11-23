import { useCallback, useEffect, useRef, useState } from 'react';

const STALE_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: unknown; at: number }>();
const inflight = new Map<string, Promise<unknown>>();

export const errorMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Algo deu errado. Tente novamente.';

/**
 * Busca dados com cache em memória (10 min) e deduplicação de requisições.
 * Passe `key = null` para não buscar nada.
 */
export function useQuery<T>(key: string | null, fetcher: () => Promise<T>, options: { initialData?: T } = {}) {
  const { initialData } = options;
  const isServer = typeof window === 'undefined';
  // Dados vindos do servidor (getStaticProps) entram no cache do cliente.
  // No servidor o cache global não é usado: ele seria compartilhado entre requisições.
  if (!isServer && key && initialData !== undefined && !cache.has(key)) {
    cache.set(key, { data: initialData, at: Date.now() });
  }

  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>(() => {
    const hit = key && !isServer ? cache.get(key) : undefined;
    const data = (hit?.data as T | undefined) ?? initialData;
    return { data, loading: Boolean(key) && data === undefined };
  });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!key) {
      setState({ loading: false });
      return;
    }
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < STALE_MS) {
      setState({ data: hit.data as T, loading: false });
      return;
    }

    let active = true;
    setState({ data: hit?.data as T | undefined, loading: true });

    let promise = inflight.get(key) as Promise<T> | undefined;
    if (!promise) {
      promise = fetcherRef.current();
      inflight.set(key, promise);
      promise.finally(() => inflight.delete(key)).catch(() => undefined);
    }

    promise
      .then((data) => {
        cache.set(key, { data, at: Date.now() });
        if (active) setState({ data, loading: false });
      })
      .catch((err) => {
        if (active) setState({ error: errorMessage(err), loading: false });
      });

    return () => {
      active = false;
    };
  }, [key, nonce]);

  const retry = useCallback(() => {
    if (key) cache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return { ...state, retry };
}
