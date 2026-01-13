import { getMovies } from "../../services/movieApi";
import type { DatabaseMovie } from "../../types/movie";
import { reviewComponent } from "../../components/review-rating";
import { ratingComponent } from "../../components/review-rating";

export default function watched(): HTMLElement {
  const container = document.createElement("div");
  container.className = "p-6";

  const title = document.createElement("h1");
  title.className = "text-3xl font-bold mb-6";
  title.textContent = "My watched Movies";

  const grid = document.createElement ("div");
  grid.className = "movie-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading history...";
  loadingMessage.className = "text-gray-500";

  container.appendChild(title);
  container.appendChild(loadingMessage);
  container.appendChild(grid);

  //Load movies asynchronously
  getMovies().then((movies: DatabaseMovie[]) => {
    loadingMessage.remove();
    //Filter so that this page is different from watchlist.
    const watchedMovies = movies.filter(movies => movies.status === 'watched');
    
    if (watchedMovies.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "You haven't marked any movies as watched yet.";
      emptyMessage.className = "text-gray-500 text-center py-8";
      container.appendChild(emptyMessage);
      return;
    }
    //Render the movies
    watchedMovies.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "movie.card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow";
      //Handled missing posters
      const imageUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : 'https://via.placeholder.com/500x750?text=No+Poster';
      // We add a star to show the rating
      card.innerHTML = `
      <img src="${imageUrl}" alt="${movie.title}" class"w-full h-auto">
      <div class="p-4">
      <h3 class="font bold text-lg mb-2">${movie.title}</h3>
      <div class="flex item-center justify-between">
        <span class="text-sm text-gray-600">Rated: ${movie.personal_rating || '-'}5</span>
        <span class="text-yellow-500">★</span>
      </div>
      <p class="text-xs text-gray-400 mt-2">Watched on: ${movie.date_watched || 'Unknown'}</p>
      </div>`;
      grid.appendChild(card);
    });
  })
  .catch((error) => {
    loadingMessage.textContent ="Failed to load history";
    console.error(error);
  });
  return container;
}