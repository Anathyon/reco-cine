import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { ListToolbar, SharedListBanner } from '../components/ListTransfer';
import { decodeRefs } from '../lib/listTransfer';
import type { MediaType } from '../types';
import { GRID_CLASS } from '../components/media/MediaGrid';
import MediaCard, { MediaCardSkeleton } from '../components/media/MediaCard';
import { EmptyState } from '../components/ui/States';
import { CloudIcon, HeartIcon } from '../components/ui/Icons';
import { SignInButton } from '../components/layout/AccountButton';
import { useAuthStore } from '../store/authStore';
import { useFavoritesStore, type FavoriteItem } from '../store/favoritesStore';

type Filter = 'all' | MediaType;
type Sort = 'recent' | 'rating' | 'title';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tudo' },
  { key: 'movie', label: 'Filmes' },
  { key: 'tv', label: 'Séries' },
  { key: 'anime', label: 'Animes' },
];

const SORTERS: Record<Sort, (a: FavoriteItem, b: FavoriteItem) => number> = {
  recent: (a, b) => b.addedAt - a.addedAt,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  title: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
};

/** Onde a lista está guardada, e o convite para entrar quando dá para salvar na conta. */
function ListStorageNote() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const sync = useAuthStore((s) => s.sync);

  if (status === 'signedIn' && user) {
    return (
      <p className="mt-2 flex items-center gap-2 text-zinc-400">
        <CloudIcon size={16} className="shrink-0 text-brand-300" />
        <span>
          {sync === 'error'
            ? 'Não foi possível sincronizar agora. As mudanças são enviadas quando a conexão voltar.'
            : sync === 'syncing'
              ? 'Sincronizando com a sua conta…'
              : `Salva na sua conta${user.email ? ` (${user.email})` : ''} e sincronizada entre seus aparelhos.`}
        </span>
      </p>
    );
  }

  if (status === 'signedOut') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-zinc-300">
          Sua lista está salva só neste aparelho. Entre com o Google para guardá-la na sua conta e acessar de qualquer lugar.
        </p>
        <SignInButton className="shrink-0" />
      </div>
    );
  }

  return (
    <p className="mt-2 text-zinc-400">
      Fica salva neste aparelho. Use “Compartilhar lista” para abrir no celular ou em outro computador.
    </p>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const sharedRefs = useMemo(() => decodeRefs(router.query.lista), [router.query.lista]);
  const closeShared = () => {
    const { lista: _lista, ...rest } = router.query;
    router.replace({ pathname: '/favorites', query: rest }, undefined, { shallow: true, scroll: false });
  };
  const items = useFavoritesStore((s) => s.items);
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');

  const all = useMemo(() => Object.values(items), [items]);
  const visible = useMemo(
    () => all.filter((i) => filter === 'all' || i.type === filter).sort(SORTERS[sort]),
    [all, filter, sort],
  );
  const count = (f: Filter) => (f === 'all' ? all.length : all.filter((i) => i.type === f).length);

  return (
    <>
      <Head>
        <title>Minha lista — Reco Cine</title>
      </Head>

      <div className="container-page pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Minha lista</h1>
            <ListStorageNote />
          </div>
          {hydrated && <ListToolbar items={Object.values(items).sort(SORTERS.recent)} />}
        </div>

        {hydrated && sharedRefs.length > 0 && <SharedListBanner refs={sharedRefs} onClose={closeShared} />}

        {!hydrated ? (
          <div className={`${GRID_CLASS} mt-8`}>
            {Array.from({ length: 7 }, (_, i) => (
              <MediaCardSkeleton key={i} />
            ))}
          </div>
        ) : all.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={<HeartIcon size={26} />}
              title="Sua lista está vazia"
              description="Toque no coração de qualquer filme, série ou anime para salvar e assistir depois."
              action={
                <Link href="/" className="btn-brand">
                  Explorar títulos
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Filtrar lista">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    role="tab"
                    aria-selected={filter === f.key}
                    onClick={() => setFilter(f.key)}
                    className={`chip ${filter === f.key ? 'chip-active' : ''}`}
                  >
                    {f.label}
                    <span className={filter === f.key ? 'text-ink-950/60' : 'text-zinc-500'}>{count(f.key)}</span>
                  </button>
                ))}
              </div>
              <select
                aria-label="Ordenar lista"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 cursor-pointer rounded-full border border-white/10 bg-ink-850 px-4 text-sm text-white"
              >
                <option value="recent">Adicionados recentemente</option>
                <option value="rating">Melhor avaliados</option>
                <option value="title">Título (A–Z)</option>
              </select>
            </div>

            {visible.length === 0 ? (
              <p className="py-16 text-center text-zinc-400">Nenhum item nesta categoria ainda.</p>
            ) : (
              <div className={`${GRID_CLASS} mt-6`}>
                {visible.map((item) => (
                  <MediaCard key={`${item.type}-${item.id}`} item={item} showType={filter === 'all'} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
