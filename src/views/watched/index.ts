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
      card.className = "movie-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow";
      
      const imageUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : 'https://via.placeholder.com/500x750?text=No+Poster';
      
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = movie.title;
      img.className = "w-full h-auto";

      const contentDiv = document.createElement('div');
      contentDiv.className = "p-4";

      const titleEl = document.createElement('h3');
      titleEl.className = "font-bold text-lg mb-2";
      titleEl.textContent = movie.title;

      const detailsDiv = document.createElement('div');
      detailsDiv.className = "flex flex-col items-center justify-between";
      
      // Här skapar vi och lägger till rating-komponenten för varje film
      const reviewForm = reviewComponent();
      const stars = ratingComponent();
      const scoreText = document.createElement('p');
      scoreText.textContent = 'Your Score'

      const watchedOn = document.createElement('p');
      watchedOn.className = "text-xs text-gray-400 mt-2";
      watchedOn.textContent = `Watched on: ${movie.date_watched || 'Unknown'}`;
      
      detailsDiv.append(scoreText, stars);
      contentDiv.append(titleEl, detailsDiv, watchedOn, reviewForm);
      card.append(img, contentDiv);
      grid.appendChild(card);
    });
  })
  .catch((error) => {
    loadingMessage.textContent ="Failed to load history";
    console.error(error);
  });
  return container;
}