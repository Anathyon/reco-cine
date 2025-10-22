import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (params: { query: string; genre: string; releaseYear: string; popularity: string }) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [popularity, setPopularity] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ query, genre, releaseYear, popularity });
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
      <input
        type="text"
        placeholder="Search for movies or series..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="p-2 rounded bg-gray-800 text-white"
      />
      <select
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="p-2 rounded bg-gray-800 text-white"
      >
        <option value="">Select Genre</option>
        {/* Add genre options here */}
      </select>
      <input
        type="number"
        placeholder="Release Year"
        value={releaseYear}
        onChange={(e) => setReleaseYear(e.target.value)}
        className="p-2 rounded bg-gray-800 text-white"
      />
      <select
        value={popularity}
        onChange={(e) => setPopularity(e.target.value)}
        className="p-2 rounded bg-gray-800 text-white"
      >
        <option value="">Select Popularity</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <button type="submit" className="p-2 rounded bg-blue-600 text-white">
        Search
      </button>
    </form>
  );
};

export default SearchBar;