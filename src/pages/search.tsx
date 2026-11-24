import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import MediaGrid, { GRID_CLASS } from '../components/media/MediaGrid';
import MediaCard, { MediaCardSkeleton } from '../components/media/MediaCard';
import PersonCard, { PEOPLE_GRID, PersonCardSkeleton } from '../components/media/PersonCard';
import { EmptyState, ErrorState } from '../components/ui/States';
import { ChevronRightIcon, SearchIcon, SparklesIcon, XIcon } from '../components/ui/Icons';
import { useDebounce } from '../hooks/useDebounce';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { useQuery } from '../hooks/useQuery';
import { getTrending, searchTmdb } from '../lib/tmdb';
import { searchAnime } from '../lib/anime';
import { searchPeople, type PersonSummary } from '../lib/people';
import { didYouMean, normalize, type FuzzyIndex, type FuzzyMatch } from '../lib/fuzzy';
import { entryToItem, fetchSpellSuggestion, loadSearchIndex } from '../lib/searchIndex';
import type { MediaItem } from '../types';

type Tab = 'all' | 'movie' | 'tv' | 'anime' | 'person';
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'movie', label: 'Filmes' },
  { key: 'tv', label: 'Séries' },
  { key: 'anime', label: 'Animes' },
  { key: 'person', label: 'Pessoas' },
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

  // Índice para a busca tolerante a erros (baixado uma vez, em segundo plano).
  const index = useQuery('search-index', loadSearchIndex);

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

  /** Troca a busca na hora (sugestões "Você quis dizer"). */
  const searchFor = (q: string) => {
    edited.current = false;
    setInput(q);
    const query: Record<string, string> = { q };
    if (tab !== 'all') query.type = tab;
    router.replace({ pathname: '/search', query }, undefined, { shallow: true, scroll: false });
    window.scrollTo?.({ top: 0 });
  };

  const correction = useMemo(() => (index.data && term ? didYouMean(index.data, term) : null), [index.data, term]);

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
            placeholder="Filmes, séries, animes ou atores…"
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
          ) : (
            <Results
              key={`${tab}:${term.toLowerCase()}`}
              term={term}
              tab={tab}
              index={index.data ?? null}
              correction={correction}
              onSearch={searchFor}
              onSeeAll={setTab}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- resultados (com correção automática) ---------- */

interface ResultsProps {
  term: string;
  tab: Tab;
  index: FuzzyIndex | null;
  correction: FuzzyMatch | null;
  onSearch: (q: string) => void;
  onSeeAll: (tab: Tab) => void;
}

/**
 * Busca o termo; se nada for encontrado, tenta a grafia corrigida (do índice
 * ou, em último caso, do Google) e mostra esses resultados, como o Google faz.
 */
function Results({ term, tab, index, correction, onSearch, onSeeAll }: ResultsProps) {
  const [empty, setEmpty] = useState(false);
  const spell = useQuery(empty && !correction ? `spell:${term.toLowerCase()}` : null, () => fetchSpellSuggestion(term));
  const fixed = empty ? correction?.name ?? (spell.data && normalize(spell.data) !== normalize(term) ? spell.data : null) : null;

  if (empty && fixed) {
    return (
      <>
        <Notice>
          Nenhum resultado para “{term}”. Mostrando resultados para{' '}
          <button type="button" onClick={() => onSearch(fixed)} className="font-semibold text-white underline-offset-2 hover:underline">
            {fixed}
          </button>
          .
        </Notice>
        <ResultsFor term={fixed} tab={tab} onSeeAll={onSeeAll} onEmpty={() => undefined} fallback={<NoResults term={term} index={index} />} />
      </>
    );
  }

  return (
    <>
      {correction && !empty && (
        <Notice>
          Você quis dizer{' '}
          <button type="button" onClick={() => onSearch(correction.name)} className="font-semibold text-white underline-offset-2 hover:underline">
            {correction.name}
          </button>
          ?
        </Notice>
      )}
      <ResultsFor
        term={term}
        tab={tab}
        onSeeAll={onSeeAll}
        onEmpty={() => setEmpty(true)}
        // Enquanto a correção não chega, mostra carregando (sem piscar "nada encontrado").
        fallback={empty && (spell.data !== undefined || spell.error) ? <NoResults term={term} index={index} /> : <ResultsSkeleton />}
      />
    </>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="mb-6 flex items-start gap-2 rounded-2xl border border-brand-400/20 bg-brand-500/10 px-4 py-3 text-sm text-zinc-300">
      <SparklesIcon size={16} className="mt-0.5 shrink-0 text-brand-300" />
      <span>{children}</span>
    </p>
  );
}

interface ResultsForProps {
  term: string;
  tab: Tab;
  onSeeAll: (tab: Tab) => void;
  /** Chamado quando a busca termina sem nenhum resultado. */
  onEmpty: () => void;
  fallback: ReactNode;
}

function ResultsFor(props: ResultsForProps) {
  if (props.tab === 'all') return <AllResults {...props} />;
  if (props.tab === 'person') return <PeopleResults {...props} />;
  return <TabResults {...props} tab={props.tab} />;
}

function useReportEmpty(isEmpty: boolean, onEmpty: () => void) {
  const ref = useRef(onEmpty);
  ref.current = onEmpty;
  useEffect(() => {
    if (isEmpty) ref.current();
  }, [isEmpty]);
}

function fetchTab(tab: 'movie' | 'tv' | 'anime', term: string, page: number) {
  return tab === 'anime' ? searchAnime(term, page) : searchTmdb(tab, term, page);
}

function TabResults({ term, tab, onEmpty, fallback }: ResultsForProps & { tab: 'movie' | 'tv' | 'anime' }) {
  const list = useInfiniteList(`search:${tab}:${term.toLowerCase()}`, (page) => fetchTab(tab, term, page));
  const isEmpty = !list.loading && !list.error && list.items.length === 0 && !list.hasMore;
  useReportEmpty(isEmpty, onEmpty);

  if (isEmpty) return <>{fallback}</>;
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

function PeopleResults({ term, onEmpty, fallback }: ResultsForProps) {
  const [pages, setPages] = useState(1);
  const [items, setItems] = useState<PersonSummary[]>([]);
  const query = useQuery(`search:person:${term.toLowerCase()}:${pages}`, () => searchPeople(term, pages));

  useEffect(() => {
    const data = query.data;
    if (!data) return;
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...data.items.filter((p) => !seen.has(p.id))];
    });
  }, [query.data]);

  const isEmpty = !query.loading && !query.error && pages === 1 && query.data?.items.length === 0;
  useReportEmpty(isEmpty, onEmpty);

  if (isEmpty) return <>{fallback}</>;
  if (query.error && !items.length) return <ErrorState message={query.error} onRetry={query.retry} />;
  return (
    <>
      <div className={PEOPLE_GRID}>
        {items.map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
        {query.loading && Array.from({ length: 7 }, (_, i) => <PersonCardSkeleton key={`s${i}`} />)}
      </div>
      {query.data?.hasMore && !query.loading && (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setPages((p) => p + 1)} className="btn-ghost">
            Carregar mais
          </button>
        </div>
      )}
    </>
  );
}

function AllResults({ term, onSeeAll, onEmpty, fallback }: ResultsForProps) {
  const key = term.toLowerCase();
  const tmdb = useQuery(`search:multi:${key}`, () => searchTmdb('multi', term));
  const anime = useQuery(`search:anime-preview:${key}`, () => searchAnime(term));
  const people = useQuery(`search:person:${key}:1`, () => searchPeople(term));

  const peopleItems = people.data?.items.filter((p) => p.photo || p.knownFor) ?? [];
  // Pessoas vêm primeiro quando o nome bate com a busca (ex.: "brad pitt").
  const personFirst = peopleItems.length > 0 && normalize(peopleItems[0].name).startsWith(normalize(term));

  const titleSections = [
    { tab: 'movie' as const, title: 'Filmes', q: tmdb, items: tmdb.data?.items.filter((i) => i.type === 'movie') },
    { tab: 'tv' as const, title: 'Séries', q: tmdb, items: tmdb.data?.items.filter((i) => i.type === 'tv') },
    { tab: 'anime' as const, title: 'Animes', q: anime, items: anime.data?.items },
  ];

  const loading = tmdb.loading || anime.loading || people.loading;
  const isEmpty =
    !loading &&
    !tmdb.error &&
    !anime.error &&
    titleSections.every((s) => !s.items?.length) &&
    !(people.data?.items.length ?? 0);
  useReportEmpty(isEmpty, onEmpty);
  if (isEmpty) return <>{fallback}</>;

  const peopleSection = peopleItems.length > 0 && (
    <section key="person">
      <SectionHeader title="Pessoas" onSeeAll={() => onSeeAll('person')} />
      <div className={PEOPLE_GRID}>
        {peopleItems.slice(0, 7).map((p) => (
          <PersonCard key={p.id} person={p} />
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-12">
      {personFirst && peopleSection}
      {titleSections.map(({ tab, title, q, items }) => {
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
            <SectionHeader title={title} onSeeAll={() => onSeeAll(tab)} />
            <div className={GRID_CLASS}>
              {items.slice(0, 14).map((item) => (
                <MediaCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        );
      })}
      {!personFirst && peopleSection}
    </div>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      <button onClick={onSeeAll} className="inline-flex items-center gap-0.5 text-sm font-medium text-zinc-400 hover:text-white">
        Ver todos <ChevronRightIcon size={16} />
      </button>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: 7 }, (_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ---------- sem termo / sem resultado ---------- */

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

function NoResults({ term, index }: { term: string; index: FuzzyIndex | null }) {
  // Mesmo sem resultado exato, mostra o que mais se parece com o que foi digitado.
  const similar = useMemo(
    () =>
      (index?.search(term, { limit: 14, minScore: 0.6, kinds: ['movie', 'tv', 'anime'] }) ?? [])
        .map((m) => entryToItem(m.entry))
        .filter((i): i is MediaItem => Boolean(i)),
    [index, term],
  );

  return (
    <div className="space-y-12">
      <EmptyState
        icon={<SearchIcon size={26} />}
        title={`Nada encontrado para “${term}”`}
        description="Confira a grafia, tente o título original (em inglês ou japonês), o nome de um ator ou use menos palavras."
      />
      {similar.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-white">Talvez você esteja procurando</h2>
          <div className={`${GRID_CLASS} mt-4`}>
            {similar.map((item) => (
              <MediaCard key={`${item.type}-${item.id}`} item={item} showType />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
