import CatalogView from '../components/CatalogView';
import { MOVIE_GENRES, discover } from '../lib/tmdb';

export default function MoviesPage() {
  return (
    <CatalogView
      type="movie"
      title="Filmes"
      description="Dos lançamentos aos clássicos — filtre por gênero e encontre o próximo filme."
      genres={MOVIE_GENRES}
      sortLabels={{ popular: 'Mais populares', top: 'Mais bem avaliados', recent: 'Lançamentos' }}
      fetchPage={(filters) => discover('movie', filters)}
      providerType="movie"
    />
  );
}
