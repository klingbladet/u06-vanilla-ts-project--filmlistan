import { getMovies } from "../../services/movieApi";
import type { DatabaseMovie } from "../../types/movie";

export default function watchlist(): HTMLElement {
  const container = document.createElement("div");
  container.className = "p-6";

  const title = document.createElement("h1");
  title.className = "text-3xl font-bold mb-6";
  title.textContent = "My Watchlist";

  const grid = document.createElement("div");
  grid.className = "movie-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading watchlist...";
  loadingMessage.className = "text-gray-500";

  container.appendChild(title);
  container.appendChild(loadingMessage);
  container.appendChild(grid);

  // Load watchlist movies asynchronously
  getMovies().then((movies: DatabaseMovie[]) => {
    // Remove loading message
    loadingMessage.remove();

    // Filter for only watchlist movies
    const watchlistMovies = movies.filter(movie => movie.status === 'watchlist');

    if (watchlistMovies.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "Your watchlist is empty. Add some movies to get started!";
      emptyMessage.className = "text-gray-500 text-center py-8";
      container.appendChild(emptyMessage);
      return;
    }

    watchlistMovies.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "movie-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow";

      const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Poster';

      card.innerHTML = `
        <img src="${imageUrl}" alt="${movie.title}" class="w-full h-auto">
        <div class="p-4">
          <h3 class="font-bold text-lg mb-2">${movie.title}</h3>
          <p class="text-sm text-gray-600">Status: ${movie.status}</p>
        </div>
      `;

      grid.appendChild(card);
    });
  }).catch((error) => {
    loadingMessage.textContent = "Failed to load watchlist. Please try again.";
    loadingMessage.className = "text-red-500";
    console.error("Error loading watchlist:", error);
  });

  return container;
}