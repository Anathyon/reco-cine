import CatalogView from '../components/CatalogView';
import { ANIME_GENRES, discoverAnime } from '../lib/jikan';

export default function AnimesPage() {
  return (
    <CatalogView
      type="anime"
      title="Animes"
      description="Da temporada atual aos maiores clássicos, com dados do MyAnimeList."
      genres={ANIME_GENRES}
      sortLabels={{ popular: 'Mais populares', top: 'Mais bem avaliados', recent: 'Em exibição' }}
      fetchPage={({ genre, sort, page, year }) => discoverAnime({ genre, sort, page, year })}
    />
  );
}
