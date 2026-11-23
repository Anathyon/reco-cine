import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import MediaGrid, { GRID_CLASS } from '../components/media/MediaGrid';
import MediaCard, { MediaCardSkeleton } from '../components/media/MediaCard';
import { EmptyState, ErrorState } from '../components/ui/States';
import { ChevronRightIcon, SearchIcon, XIcon } from '../components/ui/Icons';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { useQuery } from '../hooks/useQuery';
import { getTrending, searchTmdb } from '../lib/tmdb';
import { searchAnime } from '../lib/jikan';

type Tab = 'all' | 'movie' | 'tv' | 'anime';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'movie', label: 'Filmes' },
  { key: 'tv', label: 'Séries' },
  { key: 'anime', label: 'Animes' },
];

export default function SearchPage() {
  const router = useRouter();
  const urlQuery = typeof router.query.q === 'string' ? router.query.q : '';
  const tab: Tab = TABS.some((t) => t.key === router.query.type) ? (router.query.type as Tab) : 'all';

  const [input, setInput] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  // Só reescreve a URL depois que o usuário digitou algo.
  const edited = useRef(false);
  const updateInput = (value: string) => {
    edited.current = true;
    setInput(value);
  };
  const debounced = useDebounce(input.trim(), 350);
  const term = urlQuery.trim();

  // Sincroniza o campo com a URL (ex.: carregamento inicial ou "voltar" no histórico).
  useEffect(() => {
    if (router.isReady && urlQuery.trim() !== debounced) setInput(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, urlQuery]);

  useEffect(() => {
    if (!router.isReady || !edited.current || debounced === term) return;
    const { view: _view, ...rest } = router.query;
    const query = { ...rest, q: debounced || undefined };
    if (!debounced) delete query.q;
    router.replace({ pathname: '/search', query }, undefined, { shallow: true, scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, router.isReady]);

  const setTab = (next: Tab) => {
    const query: Record<string, string> = {};
    if (term) query.q = term;
    if (next !== 'all') query.type = next;
    router.replace({ pathname: '/search', query }, undefined, { shallow: true, scroll: false });
  };

  return (
    <>
      <Head>
        <title>{term ? `“${term}” — Busca — Reco Cine` : 'Buscar — Reco Cine'}</title>
      </Head>

      <div className="container-page pt-8 sm:pt-12">
        <h1 className="page-title">Buscar</h1>

        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            inputRef.current?.blur();
          }}
          className="relative mt-5"
        >
          <SearchIcon size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            ref={inputRef}
            type="search"
            value={input}
            onChange={(e) => updateInput(e.target.value)}
            placeholder="Filmes, séries ou animes…"
            aria-label="Buscar títulos"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            className="input h-14 rounded-2xl pl-12 pr-12 text-lg [&::-webkit-search-cancel-button]:hidden"
          />
          {input && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => {
                updateInput('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <XIcon size={18} />
            </button>
          )}
        </form>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto" role="tablist" aria-label="Tipo de conteúdo">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`chip ${tab === t.key ? 'chip-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {!term ? (
            <Suggestions onPick={updateInput} />
          ) : tab === 'all' ? (
            <AllResults term={term} onSeeAll={setTab} />
          ) : (
            <TabResults term={term} tab={tab} />
          )}
        </div>
      </div>
    </>
  );
}

function fetchTab(tab: Exclude<Tab, 'all'>, term: string, page: number) {
  return tab === 'anime' ? searchAnime(term, page) : searchTmdb(tab, term, page);
}

function TabResults({ term, tab }: { term: string; tab: Exclude<Tab, 'all'> }) {
  const list = useInfiniteList(`search:${tab}:${term.toLowerCase()}`, (page) => fetchTab(tab, term, page));

  if (!list.loading && !list.error && list.items.length === 0) return <NoResults term={term} />;
  return (
    <MediaGrid
      items={list.items}
      loading={list.loading}
      error={list.error}
      hasMore={list.hasMore}
      onLoadMore={list.loadMore}
      onRetry={list.retry}
    />
  );
}

function AllResults({ term, onSeeAll }: { term: string; onSeeAll: (tab: Tab) => void }) {
  const key = term.toLowerCase();
  const tmdb = useQuery(`search:multi:${key}`, () => searchTmdb('multi', term));
  const anime = useQuery(`search:anime-preview:${key}`, () => searchAnime(term));

  const sections = [
    { tab: 'movie' as const, title: 'Filmes', q: tmdb, items: tmdb.data?.items.filter((i) => i.type === 'movie') },
    { tab: 'tv' as const, title: 'Séries', q: tmdb, items: tmdb.data?.items.filter((i) => i.type === 'tv') },
    { tab: 'anime' as const, title: 'Animes', q: anime, items: anime.data?.items },
  ];

  const loading = tmdb.loading || anime.loading;
  const empty = !loading && sections.every((s) => !s.items?.length) && !tmdb.error && !anime.error;
  if (empty) return <NoResults term={term} />;

  return (
    <div className="space-y-12">
      {sections.map(({ tab, title, q, items }) => {
        if (q.error) {
          return (
            <section key={tab}>
              <h2 className="section-title text-lg">{title}</h2>
              <ErrorState message={q.error} onRetry={q.retry} compact />
            </section>
          );
        }
        if (q.loading) {
          return (
            <section key={tab}>
              <div className="skeleton mb-4 h-6 w-24 rounded" />
              <div className={GRID_CLASS}>
                {Array.from({ length: 7 }, (_, i) => (
                  <MediaCardSkeleton key={i} />
                ))}
              </div>
            </section>
          );
        }
        if (!items?.length) return null;
        return (
          <section key={tab}>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
              <button onClick={() => onSeeAll(tab)} className="inline-flex items-center gap-0.5 text-sm font-medium text-zinc-400 hover:text-white">
                Ver todos <ChevronRightIcon size={16} />
              </button>
            </div>
            <div className={GRID_CLASS}>
              {items.slice(0, 14).map((item) => (
                <MediaCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  const trending = useQuery('trending:all:day', () => getTrending('all', 'day').then((p) => p.items));

  return (
    <div className="space-y-10">
      {trending.data && trending.data.length > 0 && (
        <section>
          <h2 className="section-title">Buscas populares</h2>
          <div className="flex flex-wrap gap-2">
            {trending.data.slice(0, 8).map((item) => (
              <button key={`${item.type}-${item.id}`} onClick={() => onPick(item.title)} className="chip">
                <SearchIcon size={14} className="text-zinc-500" />
                {item.title}
              </button>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="section-title">Em alta hoje</h2>
        <MediaGrid
          items={trending.data ?? []}
          loading={trending.loading}
          error={trending.error}
          onRetry={trending.retry}
          showType
        />
      </section>
    </div>
  );
}

function NoResults({ term }: { term: string }) {
  return (
    <EmptyState
      icon={<SearchIcon size={26} />}
      title={`Nada encontrado para “${term}”`}
      description="Confira a grafia, tente o título original (em inglês ou japonês) ou use menos palavras."
    />
  );
}
