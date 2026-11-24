import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import MediaCard from '../../components/media/MediaCard';
import { GRID_CLASS } from '../../components/media/MediaGrid';
import Poster from '../../components/media/Poster';
import TranslatedText from '../../components/media/TranslatedText';
import { ErrorState } from '../../components/ui/States';
import { ExternalIcon } from '../../components/ui/Icons';
import { useQuery } from '../../hooks/useQuery';
import { getPerson, personHref, type Credit, type PersonDetails } from '../../lib/people';

interface Props {
  id: number;
  person: PersonDetails | null;
  siteUrl: string;
}

export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const id = Number(params?.id);
  if (!Number.isInteger(id) || id <= 0) return { notFound: true };

  const [{ tmdbServer }, { normalizePerson, PERSON_PARAMS }, { siteUrl }] = await Promise.all([
    import('../../lib/tmdbServer'),
    import('../../lib/people'),
    import('../../lib/mediaServer'),
  ]);
  try {
    const raw = await tmdbServer(`person/${id}`, PERSON_PARAMS, 8000);
    return { props: { id, person: normalizePerson(raw), siteUrl: siteUrl() }, revalidate: 86400 };
  } catch (err) {
    if ((err as { status?: number }).status === 404) return { notFound: true, revalidate: 3600 };
    return { props: { id, person: null, siteUrl: siteUrl() }, revalidate: 60 };
  }
};

type Tab = 'acting' | 'crew';
const INITIAL = 28;

function CreditsGrid({ items }: { items: Credit[] }) {
  const [limit, setLimit] = useState(INITIAL);
  return (
    <>
      <div className={GRID_CLASS}>
        {items.slice(0, limit).map((c) => (
          <div key={`${c.type}-${c.id}`}>
            <MediaCard item={c} showType />
            {c.role && <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{c.role}</p>}
          </div>
        ))}
      </div>
      {items.length > limit && (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setLimit((l) => l + INITIAL * 2)} className="btn-ghost">
            Mostrar mais ({items.length - limit})
          </button>
        </div>
      )}
    </>
  );
}

export default function PersonPage({ id, person: initial, siteUrl }: Props) {
  const query = useQuery(`person:${id}`, () => getPerson(id), { initialData: initial ?? undefined });
  const p = query.data;
  const [tab, setTab] = useState<Tab | null>(null);

  if (query.error) {
    return (
      <div className="container-page pt-12">
        <ErrorState message={query.error} onRetry={query.retry} />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="container-page pt-12">
        <div className="flex gap-6">
          <div className="skeleton h-40 w-40 shrink-0 rounded-full" />
          <div className="flex-1 space-y-3 pt-4">
            <div className="skeleton h-8 w-1/2 rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'acting' as const, label: 'Atuação', items: p.acting },
    { key: 'crew' as const, label: 'Direção, roteiro e produção', items: p.crew },
  ].filter((t) => t.items.length > 0);
  // Diretores abrem na aba de direção; atores, na de atuação.
  const current = tabs.find((t) => t.key === tab) ?? (p.department !== 'Atuação' && p.crew.length ? tabs.find((t) => t.key === 'crew') : tabs[0]);

  const url = `${siteUrl}${personHref(id)}`;
  const description = p.knownFor ? `${p.name}: filmes e séries, incluindo ${p.knownFor}.` : `${p.name}: filmes e séries no Reco Cine.`;

  return (
    <>
      <Head>
        <title>{`${p.name} — Reco Cine`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="profile" key="og:type" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={p.name} key="og:title" />
        <meta property="og:description" content={description} key="og:description" />
        {p.photo && <meta property="og:image" content={p.photo} key="og:image" />}
      </Head>

      <div className="container-page pt-8 sm:pt-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
          <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-52">
            <div className="aspect-[2/3] overflow-hidden rounded-3xl bg-ink-800 shadow-2xl shadow-black/50 ring-1 ring-white/10">
              <Poster src={p.photo} alt={p.name} priority className="h-full w-full" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">{p.department ?? 'Pessoa'}</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">{p.name}</h1>
            {p.facts.length > 0 && (
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                {p.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-zinc-500">{f.label}</dt>
                    <dd className="text-zinc-200">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <section className="mt-6 max-w-3xl">
              <h2 className="section-title">Biografia</h2>
              {p.biography ? (
                <p className="line-clamp-[12] whitespace-pre-line leading-relaxed text-zinc-300">{p.biography}</p>
              ) : (
                <TranslatedText type="person" id={id} text="" emptyText="Biografia ainda não disponível." className="line-clamp-[14]" />
              )}
            </section>
            <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
              Ver no TMDB <ExternalIcon size={14} />
            </a>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="sr-only">Filmografia</h2>
          {tabs.length > 1 && (
            <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto" role="tablist" aria-label="Filmografia">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={current?.key === t.key}
                  onClick={() => setTab(t.key)}
                  className={`chip ${current?.key === t.key ? 'chip-active' : ''}`}
                >
                  {t.label}
                  <span className={current?.key === t.key ? 'text-ink-950/60' : 'text-zinc-500'}>{t.items.length}</span>
                </button>
              ))}
            </div>
          )}
          {current ? (
            <CreditsGrid key={current.key} items={current.items} />
          ) : (
            <p className="text-zinc-400">Nenhum título encontrado.</p>
          )}
        </section>
      </div>
    </>
  );
}
