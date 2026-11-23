import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import type { Genre, MediaItem, MediaType, Page } from '../types';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { useDetailsRoute } from '../hooks/useDetailsRoute';
import { useQuery } from '../hooks/useQuery';
import { getStreamingProviders, type TmdbType } from '../lib/tmdb';
import { toast } from '../store/toastStore';
import MediaGrid from './media/MediaGrid';
import { ShuffleIcon } from './ui/Icons';

export type CatalogSort = 'popular' | 'top' | 'recent';

interface Props {
  type: MediaType;
  title: string;
  description: string;
  genres: Genre[];
  sortLabels: Record<CatalogSort, string>;
  fetchPage: (opts: CatalogFilters & { page: number }) => Promise<Page<MediaItem>>;
  /** Mostra o filtro "Onde assistir" com os serviços do TMDB para este tipo. */
  providerType?: TmdbType;
}

export interface CatalogFilters {
  genre?: number;
  sort: CatalogSort;
  year?: number;
  provider?: number;
}

const SORTS: CatalogSort[] = ['popular', 'top', 'recent'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1950 + 2 }, (_, i) => CURRENT_YEAR + 1 - i);
const SELECT_CLASS =
  'h-11 cursor-pointer rounded-full border border-white/10 bg-ink-850 px-4 pr-9 text-sm font-medium text-white transition hover:border-white/25';

export default function CatalogView({ type, title, description, genres, sortLabels, fetchPage, providerType }: Props) {
  const router = useRouter();
  const { open } = useDetailsRoute();
  const [surprising, setSurprising] = useState(false);

  // Filtros ficam na URL: dá para compartilhar e o "voltar" mantém a seleção.
  const genre = Number(router.query.genre) || undefined;
  const sort: CatalogSort = SORTS.includes(router.query.sort as CatalogSort) ? (router.query.sort as CatalogSort) : 'popular';
  const year = YEARS.includes(Number(router.query.year)) ? Number(router.query.year) : undefined;
  const provider = providerType ? Number(router.query.provider) || undefined : undefined;
  const filters: CatalogFilters = { genre, sort, year, provider };

  const providers = useQuery(providerType ? `providers:${providerType}` : null, () => getStreamingProviders(providerType!));

  const list = useInfiniteList(
    router.isReady ? `${type}:${genre ?? 'all'}:${sort}:${year ?? 'any'}:${provider ?? 'any'}` : null,
    (page) => fetchPage({ ...filters, page }),
  );

  const setFilter = (next: { genre?: number | null; sort?: CatalogSort; year?: number | null; provider?: number | null }) => {
    const merged = {
      genre: next.genre === undefined ? genre : next.genre,
      sort: next.sort ?? sort,
      year: next.year === undefined ? year : next.year,
      provider: next.provider === undefined ? provider : next.provider,
    };
    const query: Record<string, string> = {};
    if (merged.genre) query.genre = String(merged.genre);
    if (merged.sort !== 'popular') query.sort = merged.sort;
    if (merged.year) query.year = String(merged.year);
    if (merged.provider) query.provider = String(merged.provider);
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
  };

  const hasFilters = Boolean(genre || year || provider || sort !== 'popular');

  const surprise = useCallback(async () => {
    setSurprising(true);
    try {
      const page = await fetchPage({ ...filters, page: 1 + Math.floor(Math.random() * 5) });
      const pool = page.items.length ? page.items : list.items;
      if (!pool.length) throw new Error();
      open(pool[Math.floor(Math.random() * pool.length)]);
    } catch {
      toast('Não foi possível sortear agora. Tente de novo.');
    } finally {
      setSurprising(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, genre, sort, year, provider, list.items, open]);

  const activeGenre = genres.find((g) => g.id === genre);

  return (
    <>
      <Head>
        <title>{`${activeGenre ? `${title}: ${activeGenre.name}` : title} — Reco Cine`}</title>
      </Head>

      <div className="container-page pt-8 sm:pt-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="mt-2 text-zinc-400">{description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              aria-label="Ordenar por"
              value={sort}
              onChange={(e) => setFilter({ sort: e.target.value as CatalogSort })}
              className={SELECT_CLASS}
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {sortLabels[s]}
                </option>
              ))}
            </select>
            <select
              aria-label="Ano de lançamento"
              value={year ?? ''}
              onChange={(e) => setFilter({ year: Number(e.target.value) || null })}
              className={SELECT_CLASS}
            >
              <option value="">Qualquer ano</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {providerType && (
              <select
                aria-label="Onde assistir"
                value={provider ?? ''}
                onChange={(e) => setFilter({ provider: Number(e.target.value) || null })}
                className={SELECT_CLASS}
                disabled={!providers.data && !provider}
              >
                <option value="">Qualquer streaming</option>
                {provider && !providers.data?.some((p) => p.id === provider) && <option value={provider}>Serviço selecionado</option>}
                {providers.data?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <button onClick={surprise} disabled={surprising} className="btn-brand h-11" title="Abrir um título aleatório com os filtros atuais">
              <ShuffleIcon size={17} className={surprising ? 'animate-spin' : ''} />
              Surpreenda-me
            </button>
            {hasFilters && (
              <button
                onClick={() => router.replace({ pathname: router.pathname }, undefined, { shallow: true, scroll: false })}
                className="h-11 rounded-full px-4 text-sm font-medium text-zinc-400 transition hover:text-white"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-30 mt-6 border-b border-white/5 bg-ink-950/85 backdrop-blur-xl">
        <div className="row-inset no-scrollbar flex gap-2 overflow-x-auto py-3" role="toolbar" aria-label="Filtrar por gênero">
          <button
            onClick={() => setFilter({ genre: null })}
            aria-pressed={!genre}
            className={`chip ${!genre ? 'chip-active' : ''}`}
          >
            Todos
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilter({ genre: g.id === genre ? null : g.id })}
              aria-pressed={g.id === genre}
              className={`chip ${g.id === genre ? 'chip-active' : ''}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div className="container-page pt-6">
        <MediaGrid
          items={list.items}
          loading={list.loading || !router.isReady}
          error={list.error}
          hasMore={list.hasMore}
          onLoadMore={list.loadMore}
          onRetry={list.retry}
        />
        {!list.loading && !list.error && router.isReady && list.items.length === 0 && (
          <p className="py-16 text-center text-zinc-400">Nenhum título encontrado com esses filtros.</p>
        )}
      </div>
    </>
  );
}
