import { deleteMovie, getMovies, updateMovie } from "../../services/movieApi";
import { deleteButtonComponent } from "../../components/buttons";
import type { DatabaseMovie } from "../../types/movie";

export default function watchlist(): HTMLElement {
  const container = document.createElement("div");
  container.className = "p-6";
  
  const header = document.createElement("div");
  header.className = "flex justify-between items-center mb-6";

  const title = document.createElement("h1");
  title.className ="text-3xl font-bold";
  title.textContent = "My Watchlist";

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear All"
  clearBtn.className ="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400";

  header.appendChild(title);
  header.appendChild(clearBtn);
  container.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "movie-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading watchlist...";
  loadingMessage.className = "text-gray-500";

  function showEmptyMessage() {
    grid.innerHTML = "";
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "Your watchlist is empty. Add some movies to get started!";
    emptyMessage.className = "text-gray-500 text-center py-8";
    container.appendChild(emptyMessage);
    clearBtn.style.display = 'none';
  }

  container.appendChild(loadingMessage);
  container.appendChild(grid);

  // Load watchlist movies asynchronously
  getMovies().then((movies: DatabaseMovie[]) => {
    loadingMessage.remove();
    const watchlistMovies = movies.filter(movie => movie.status === 'watchlist');

    if (watchlistMovies.length === 0) {
      showEmptyMessage();
      return;
    }

    clearBtn.addEventListener('click', async () => {
      if (!confirm(`Are you sure you want to remove all ${watchlistMovies.length} movies from your watchlist?`)) {
        return;
      }

      clearBtn.disabled = true;
      clearBtn.textContent ="Clearing...";
      try {
        await Promise.all(watchlistMovies.map(movie => deleteMovie(movie.id)));
        showEmptyMessage(); // Update UI without reloading
      }
      catch (error) {
        console.error("Failed to clear watchlist", error);
        alert("Something went wrong while clearing the list");
      } finally {
        clearBtn.disabled = false;
        clearBtn.textContent = "Clear All";
      }
    });

    watchlistMovies.forEach((movie) => {
      const card = document.createElement("div");
      card.className = "movie-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow relative";

      const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://via.placeholder.com/500x750?text=No+Poster';
      
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = movie.title;
      img.className = "w-full h-auto";

      const contentDiv = document.createElement('div');
      contentDiv.className = "p-4 flex flex-col";

      const titleEl = document.createElement('h3');
      titleEl.className = "font-bold text-lg mb-2";
      titleEl.textContent = movie.title;

      const watchedBtn = document.createElement('button');
      watchedBtn.textContent = "Mark Watched";
      watchedBtn.className = "btn-watched mt-4 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors text-sm";
      
      watchedBtn.addEventListener('click', async () => {
        try {
          watchedBtn.textContent = "Updating...";
          watchedBtn.disabled = true;
          await updateMovie(movie.id, { status: 'watched' });
          card.remove();

          if (grid.children.length === 0) {
            showEmptyMessage();
          }
        }
        catch (error) {
          console.error("Failed to update movie", error);
          watchedBtn.textContent = "Error!";
          setTimeout(() => {
            watchedBtn.textContent = "Mark Watched";
            watchedBtn.disabled = false;
          }, 2000);
        }
      });
      
      const deleteButton = deleteButtonComponent(movie.id, () => {
        card.remove();
        if (grid.children.length === 0) {
          showEmptyMessage();
        }
      });

      contentDiv.append(titleEl, watchedBtn);
      card.append(img, contentDiv, deleteButton);
      grid.appendChild(card);
    });
  }).catch((error) => {
    loadingMessage.textContent = "Failed to load watchlist. Please try again.";
    loadingMessage.className = "text-red-500";
    console.error("Error loading watchlist:", error);
  });

  return container;
}