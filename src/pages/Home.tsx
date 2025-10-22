export default function Home() {
  return (
    <div className="bg-gray-950 text-white min-h-screen flex flex-col">
      <header className="p-4">
        <h1 className="text-3xl font-bold">Welcome to Movie Search</h1>
      </header>
      <main className="grow p-4">
        <h2 className="text-2xl mb-4">Popular Movies and Series</h2>
        {/* Placeholder for movie and series cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* MovieCard components will be rendered here */}
        </div>
      </main>
      <footer className="p-4">
        <p>&copy; {new Date().getFullYear()} Movie Search. All rights reserved.</p>
      </footer>
    </div>
  );
}