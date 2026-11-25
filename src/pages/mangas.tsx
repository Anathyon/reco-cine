import CatalogView from '../components/CatalogView';
import { MANGA_GENRES, discoverManga } from '../lib/manga';

export default function MangasPage() {
  return (
    <CatalogView
      type="manga"
      title="Mangás"
      description="Mangás, manhwas e light novels mais lidos e mais bem avaliados, com dados do MyAnimeList."
      genres={MANGA_GENRES}
      sortLabels={{ popular: 'Mais populares', top: 'Mais bem avaliados' }}
      yearFilter={false}
      fetchPage={({ genre, sort, page }) => discoverManga({ genre, sort: sort === 'top' ? 'top' : 'popular', page })}
    />
  );
}
