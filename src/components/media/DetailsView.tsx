import Link from 'next/link';
import { useState } from 'react';
import type { MediaDetails, MediaType } from '../../types';
import { TYPE_LABEL } from '../../types';
import { formatRating, ratingColor } from '../../lib/format';
import { getAnimeCharacters, getDetails, getSimilar, titleHref } from '../../lib/media';
import { useQuery } from '../../hooks/useQuery';
import { toast } from '../../store/toastStore';
import FavoriteButton from './FavoriteButton';
import { MediaRow } from './MediaRow';
import Poster from './Poster';
import { ErrorState } from '../ui/States';
import { ExternalIcon, PlayIcon, ShareIcon, StarIcon, XIcon } from '../ui/Icons';

interface Props {
  type: MediaType;
  id: number;
  /** Detalhes já carregados no servidor (página /title/...). */
  initialDetails?: MediaDetails | null;
  variant?: 'modal' | 'page';
}

/** Conteúdo completo de um título; usado no modal e na página própria. */
export default function DetailsView({ type, id, initialDetails, variant = 'modal' }: Props) {
  const details = useQuery(`details:${type}-${id}`, () => getDetails(type, id), {
    initialData: initialDetails ?? undefined,
  });
  const similar = useQuery(details.data ? `similar:${type}-${id}` : null, () => getSimilar(type, id));
  const animeCast = useQuery(details.data && type === 'anime' ? `cast:anime-${id}` : null, () => getAnimeCharacters(id));
  const [playing, setPlaying] = useState(false);
  const Title = variant === 'page' ? 'h1' : 'h2';

  if (details.error) {
    return (
      <div className="p-6 pt-16 sm:p-10">
        <ErrorState message={details.error} onRetry={details.retry} />
      </div>
    );
  }

  const d = details.data;
  if (!d) return <DetailsSkeleton />;
  const cast = d.cast.length ? d.cast : animeCast.data ?? [];

  return (
    <>
      <Backdrop details={d} playing={playing} />

      <div className="relative z-10 -mt-24 px-5 pb-10 sm:-mt-32 sm:px-10">
        <div className="flex gap-5 sm:gap-8">
          <div className="hidden w-44 shrink-0 sm:block lg:w-52">
            <div className="aspect-[2/3] overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10">
              <Poster src={d.poster} alt={d.title} priority className="h-full w-full" />
            </div>
          </div>

          <div className="min-w-0 flex-1 sm:pt-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">{TYPE_LABEL[d.type]}</p>
            <Title id="details-title" className="mt-1 text-balance font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              {d.title}
            </Title>
            {d.originalTitle && <p className="mt-1 text-sm text-zinc-400">{d.originalTitle}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-300">
              {formatRating(d.rating) && (
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <StarIcon size={16} className={ratingColor(d.rating)} />
                  {formatRating(d.rating)}
                  <span className="font-normal text-zinc-500">/10</span>
                </span>
              )}
              {d.year && <span>{d.year}</span>}
              {d.facts.find((f) => f.label === 'Duração') && <span>{d.facts.find((f) => f.label === 'Duração')!.value}</span>}
              {d.facts.find((f) => f.label === 'Temporadas') && (
                <span>
                  {d.facts.find((f) => f.label === 'Temporadas')!.value} temporada
                  {d.facts.find((f) => f.label === 'Temporadas')!.value === '1' ? '' : 's'}
                </span>
              )}
            </div>

            {d.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {d.genres.slice(0, 6).map((g) => (
                  <span key={g} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {d.trailerKey && (
                <button onClick={() => setPlaying((p) => !p)} className="btn-primary">
                  {playing ? <XIcon size={18} /> : <PlayIcon size={18} />}
                  {playing ? 'Fechar trailer' : 'Assistir trailer'}
                </button>
              )}
              <FavoriteButton item={d} />
              <ShareButton title={d.title} path={titleHref(d)} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_17rem]">
          <div className="min-w-0 space-y-10">
            <section>
              <h3 className="section-title">Sinopse</h3>
              {d.tagline && <p className="mb-2 italic text-zinc-400">“{d.tagline}”</p>}
              <p className="leading-relaxed text-zinc-300">{d.overview || 'Sinopse ainda não disponível em português.'}</p>
              {d.type === 'anime' && d.overview && <p className="mt-2 text-xs text-zinc-500">Sinopse original do MyAnimeList (em inglês).</p>}
            </section>

            {cast.length > 0 && (
              <section>
                <h3 className="section-title">{d.type === 'anime' ? 'Personagens' : 'Elenco principal'}</h3>
                <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 sm:-mx-10 sm:px-10">
                  {cast.map((c) => (
                    <div key={`${c.id}-${c.role}`} className="w-20 shrink-0 text-center sm:w-24">
                      <div className="mx-auto aspect-square w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-white/10">
                        <Poster src={c.photo} alt={c.name} className="h-full w-full" />
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs font-medium text-zinc-200">{c.name}</p>
                      {c.role && <p className="line-clamp-1 text-[11px] text-zinc-500">{c.role}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-8">
            <section>
              <h3 className="section-title">Onde assistir</h3>
              {d.providers.length > 0 ? (
                <>
                  <ul className="flex flex-wrap gap-2">
                    {d.providers.map((p) => {
                      const content = (
                        <>
                          {p.logo && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.logo} alt="" className="h-7 w-7 rounded-md" loading="lazy" />
                          )}
                          <span className="text-xs font-medium text-zinc-200">{p.name}</span>
                        </>
                      );
                      const href = p.url || d.providersLink;
                      return (
                        <li key={p.name}>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-xl bg-white/5 py-1.5 pl-1.5 pr-3 ring-1 ring-white/10 transition hover:bg-white/10"
                            >
                              {content}
                            </a>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl bg-white/5 py-1.5 pl-1.5 pr-3 ring-1 ring-white/10">{content}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {d.type !== 'anime' && <p className="mt-2 text-[11px] text-zinc-500">Disponibilidade no Brasil · dados JustWatch</p>}
                </>
              ) : (
                <p className="text-sm text-zinc-500">Sem informação de streaming no Brasil.</p>
              )}
            </section>

            {d.facts.length > 0 && (
              <section>
                <h3 className="section-title">Informações</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:grid-cols-1">
                  {d.facts.map((f) => (
                    <div key={f.label}>
                      <dt className="text-xs text-zinc-500">{f.label}</dt>
                      <dd className="text-zinc-200">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <div className="flex flex-col items-start gap-2">
              {variant === 'modal' && (
                <Link href={titleHref(d)} className="text-sm font-medium text-brand-300 hover:text-brand-400">
                  Abrir página do título
                </Link>
              )}
              <a href={d.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white">
                {d.externalLabel} <ExternalIcon size={14} />
              </a>
            </div>
          </aside>
        </div>
      </div>

      {(similar.loading || (similar.data && similar.data.length > 0)) && (
        <div className="border-t border-white/5 pb-10 pt-8 [&_.container-page]:px-5 sm:[&_.container-page]:px-10 [&_.row-inset]:px-5 sm:[&_.row-inset]:px-10">
          <MediaRow title="Você também pode gostar" items={similar.data} loading={similar.loading} />
        </div>
      )}
    </>
  );
}

function Backdrop({ details: d, playing }: { details: MediaDetails; playing: boolean }) {
  if (playing && d.trailerKey) {
    return (
      <div>
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${d.trailerKey}?autoplay=1&rel=0&modestbranding=1`}
            title={`Trailer de ${d.title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        {/* espaço para o conteúdo que sobe sobre o topo (-mt) sem cobrir o vídeo */}
        <div className="h-24 sm:h-32" />
      </div>
    );
  }

  const image = d.backdrop || d.poster;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-800 sm:aspect-[21/9]">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className={`h-full w-full object-cover ${d.backdrop ? 'object-top' : 'scale-110 object-center opacity-60 blur-2xl'}`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
    </div>
  );
}

function ShareButton({ title, path }: { title: string; path: string }) {
  const share = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast('Link copiado');
      }
    } catch {
      /* usuário cancelou */
    }
  };
  return (
    <button onClick={share} className="btn-icon h-11 w-11" aria-label="Compartilhar">
      <ShareIcon size={18} />
    </button>
  );
}

function DetailsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando detalhes">
      <div className="skeleton aspect-[4/3] w-full sm:aspect-[21/9]" />
      <div className="flex gap-8 px-5 py-8 sm:px-10">
        <div className="skeleton hidden aspect-[2/3] w-52 rounded-2xl sm:block" />
        <div className="flex-1 space-y-4">
          <div className="skeleton h-9 w-2/3 rounded-lg" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="flex gap-3 pt-4">
            <div className="skeleton h-11 w-40 rounded-full" />
            <div className="skeleton h-11 w-36 rounded-full" />
          </div>
          <div className="space-y-2 pt-6">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
