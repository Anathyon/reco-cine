import useFavoritesStore from '../store/favoritesStore';
import MovieCard from '../components/MovieCard';

const Favorites = () => {
  const { favorites } = useFavoritesStore();



  return (
    <div className="bg-gray-950 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Your Favorite Movies and Series</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-400">You have no favorites yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((item) => (
            <MovieCard 
              key={item.id} 
              item={item}
              onClick={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;