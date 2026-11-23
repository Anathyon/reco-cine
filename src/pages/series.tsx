import CatalogView from '../components/CatalogView';
import { TV_GENRES, discover } from '../lib/tmdb';

export default function SeriesPage() {
  return (
    <CatalogView
      type="tv"
      title="Séries"
      description="As séries que todo mundo está vendo e as que você ainda vai descobrir."
      genres={TV_GENRES}
      sortLabels={{ popular: 'Mais populares', top: 'Mais bem avaliadas', recent: 'Estreias recentes' }}
      fetchPage={(filters) => discover('tv', filters)}
      providerType="tv"
    />
  );
}
