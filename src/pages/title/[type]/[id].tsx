import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import DetailsView from '../../../components/media/DetailsView';
import { ChevronLeftIcon } from '../../../components/ui/Icons';
import { isMediaType, titleHref } from '../../../lib/media';
import type { MediaDetails, MediaType } from '../../../types';
import { TYPE_LABEL } from '../../../types';

interface Props {
  type: MediaType;
  id: number;
  details: MediaDetails | null;
  siteUrl: string;
}

const CATALOG: Record<MediaType, { href: string; label: string }> = {
  movie: { href: '/movies', label: 'Filmes' },
  tv: { href: '/series', label: 'Séries' },
  anime: { href: '/animes', label: 'Animes' },
  manga: { href: '/mangas', label: 'Mangás' },
};

// Nenhuma página é gerada no build: cada título é gerado na primeira visita e fica em cache.
export const getStaticPaths: GetStaticPaths = async () => ({ paths: [], fallback: 'blocking' });

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const type = params?.type;
  const id = Number(params?.id);
  if (!isMediaType(type) || !Number.isInteger(id) || id <= 0) return { notFound: true };

  const { getDetailsServer, siteUrl } = await import('../../../lib/mediaServer');
  try {
    const details = await getDetailsServer(type, id);
    if (!details) return { notFound: true, revalidate: 3600 };
    return { props: { type, id, details, siteUrl: siteUrl() }, revalidate: 86400 };
  } catch {
    // Falha temporária (API fora do ar / sem chave): o navegador carrega os dados.
    return { props: { type, id, details: null, siteUrl: siteUrl() }, revalidate: 60 };
  }
};

export default function TitlePage({ type, id, details, siteUrl }: Props) {
  const catalog = CATALOG[type];
  const url = `${siteUrl}${titleHref({ type, id })}`;
  const name = details ? `${details.title}${details.year ? ` (${details.year})` : ''}` : TYPE_LABEL[type];
  const description = details?.overview
    ? details.overview.length > 160
      ? `${details.overview.slice(0, 157).trimEnd()}…`
      : details.overview
    : type === 'manga'
      ? 'Veja detalhes e recomendações no Reco Cine.'
      : 'Veja detalhes, trailer e onde assistir no Reco Cine.';
  // Imagem leve para a prévia (WhatsApp/Telegram ignoram imagens muito pesadas).
  const image = (details?.backdrop || details?.poster)?.replace('/original/', '/w780/');

  return (
    <>
      <Head>
        <title>{`${name} — Reco Cine`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content={type === 'movie' ? 'video.movie' : type === 'manga' ? 'book' : 'video.tv_show'} key="og:type" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={name} key="og:title" />
        <meta property="og:description" content={description} key="og:description" />
        {image && <meta property="og:image" content={image} key="og:image" />}
        <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
        <meta name="twitter:title" content={name} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
      </Head>

      <div className="mx-auto w-full max-w-5xl sm:px-4 sm:pt-6">
        <Link
          href={catalog.href}
          className="inline-flex items-center gap-1 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:text-white sm:px-0"
        >
          <ChevronLeftIcon size={16} /> {catalog.label}
        </Link>
        <article className="overflow-hidden bg-ink-900 ring-1 ring-white/10 sm:rounded-3xl">
          <DetailsView key={`${type}-${id}`} type={type} id={id} initialDetails={details} variant="page" />
        </article>
      </div>
    </>
  );
}
