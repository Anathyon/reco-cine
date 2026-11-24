import type { GetStaticProps } from 'next';
import Head from 'next/head';
import HeroBanner from '../components/media/HeroBanner';
import { LazyMediaRow, MediaRow } from '../components/media/MediaRow';
import { useQuery } from '../hooks/useQuery';
import { getList, getTrending } from '../lib/tmdb';
import { getSeasonNow, getTopAnime } from '../lib/anime';
import { useFavoritesStore } from '../store/favoritesStore';
import type { MediaItem } from '../types';

interface Props {
  heroItems: MediaItem[] | null;
  todayItems: MediaItem[] | null;
}

// ISR: o HTML já sai com o banner e a primeira fileira, e é regenerado a cada hora.
export const getStaticProps: GetStaticProps<Props> = async () => {
  const { getTrendingServer } = await import('../lib/tmdbServer');
  const [week, day] = await Promise.allSettled([getTrendingServer('all', 'week'), getTrendingServer('all', 'day')]);
  const ok = week.status === 'fulfilled' && day.status === 'fulfilled';
  return {
    props: {
      heroItems: week.status === 'fulfilled' ? week.value : null,
      todayItems: day.status === 'fulfilled' ? day.value : null,
    },
    // Sem dados (TMDB fora do ar ou sem chave no build): tenta de novo em 1 minuto.
    revalidate: ok ? 3600 : 60,
  };
};

export default function HomePage({ heroItems, todayItems }: Props) {
  const hero = useQuery('trending:all:week', () => getTrending('all', 'week').then((p) => p.items), {
    initialData: heroItems ?? undefined,
  });
  const favorites = useFavoritesStore((s) => s.items);
  const myList = Object.values(favorites).sort((a, b) => b.addedAt - a.addedAt);

  return (
    <>
      <Head>
        <title>Reco Cine — o que assistir hoje</title>
      </Head>

      <HeroBanner items={hero.data} loading={hero.loading} error={hero.error} onRetry={hero.retry} />

      <div className="relative z-10 -mt-6 space-y-10 sm:-mt-10 sm:space-y-12">
        <LazyMediaRow
          title="Em alta hoje"
          queryKey="trending:all:day"
          fetcher={() => getTrending('all', 'day').then((p) => p.items)}
          initialItems={todayItems ?? undefined}
          showType
        />

        {myList.length > 0 && <MediaRow title="Sua lista" href="/favorites" items={myList.slice(0, 20)} showType />}

        <LazyMediaRow
          title="Filmes populares"
          href="/movies"
          queryKey="movie:popular"
          fetcher={() => getList('movie', 'popular').then((p) => p.items)}
        />
        <LazyMediaRow
          title="Séries em alta"
          href="/series"
          queryKey="trending:tv:week"
          fetcher={() => getTrending('tv', 'week').then((p) => p.items)}
        />
        <LazyMediaRow
          title="Animes da temporada"
          href="/animes?sort=recent"
          queryKey="anime:season-now"
          fetcher={() => getSeasonNow().then((p) => p.items)}
        />
        <LazyMediaRow
          title="Nos cinemas"
          queryKey="movie:now_playing"
          fetcher={() => getList('movie', 'now_playing').then((p) => p.items)}
        />
        <LazyMediaRow
          title="Filmes aclamados"
          href="/movies?sort=top"
          queryKey="movie:top_rated"
          fetcher={() => getList('movie', 'top_rated').then((p) => p.items)}
        />
        <LazyMediaRow
          title="Séries aclamadas"
          href="/series?sort=top"
          queryKey="tv:top_rated"
          fetcher={() => getList('tv', 'top_rated').then((p) => p.items)}
        />
        <LazyMediaRow
          title="Animes mais populares"
          href="/animes"
          queryKey="anime:top:popularity"
          fetcher={() => getTopAnime(1, 'bypopularity').then((p) => p.items)}
        />
      </div>
    </>
  );
}
