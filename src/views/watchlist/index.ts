import { deleteMovie, getMovies, updateMovie } from "../../services/movieApi";
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

 
  container.appendChild(loadingMessage);
  container.appendChild(grid);

  // Load watchlist movies asynchronously
  getMovies().then((movies: DatabaseMovie[]) => {
    // Remove loading message
    loadingMessage.remove();

    // Filter for only watchlist movies
    const watchlistMovies = movies.filter(movie => movie.status === 'watchlist');

    //Logic for clear all btn. Hides the btn if there are no movies in watchlist
    if (watchlistMovies.length === 0) {
      clearBtn.style.display = 'none';
    }

    clearBtn.addEventListener('click', async () => {
      const count = watchlistMovies.length;
      if (!confirm(`Are you sure you want to remove all ${count} movies from your watchlist`)) {
        return;
      }

      clearBtn.disabled = true;
      clearBtn.textContent ="Clearing...";
      try {
        await Promise.all(watchlistMovies.map(movie => deleteMovie(movie.id)));
        location.reload();
      }
      catch (error) {
        console.error("Failed to clear watchlist", error);
        alert("Something went wrong while clearing the list");
        clearBtn.disabled = false;
        clearBtn.textContent = "Clear All";
      }
    });

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

          <div class="flex gap-2">
            <button class="btn-watched flex-1 bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600 transition-colors text-sm">
            Mark Watched
            </button>
            <button class="btn-delete flex-1 bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 transition-colors text-sm">
            Remove
            </button>
          </div>
        </div>
      `;
      // Find the buttons we just created
      const watchedBtn = card.querySelector('.btn-watched') as HTMLButtonElement;
      const deleteBtn = card.querySelector('.btn-delete') as HTMLButtonElement;

      //Add eventlistner for watched
      watchedBtn.addEventListener('click', async () => {
        try {
          watchedBtn.textContent = "Updating...";
          watchedBtn.disabled = true;
          //Call TMDB API
          await updateMovie(movie.id, { status: 'watched' });
          //Remove the card from UI
          card.remove();

          if (grid.children.length === 0) {
            location.reload();
          }
        }
        catch (error) {
          console.error("Failed to update movie", error);
          watchedBtn.textContent = "Error!";
          setTimeout(() => {
            watchedBtn.textContent = "Marked watched";
            watchedBtn.disabled = false;
          }, 2000);
        }
      });

      deleteBtn.addEventListener('click', async () => {
        if(!confirm("Are you sure you want to remove this movie?")) return;

        try {
          deleteBtn.textContent = "...";
          await deleteMovie(movie.id);
          card.remove();
            if (grid.children.length === 0) {
              location.reload();
            }
        }
        catch (error) {
          console.error ("Failed to delete", error);
        }
      });

      grid.appendChild(card);
    });
  }).catch((error) => {
    loadingMessage.textContent = "Failed to load watchlist. Please try again.";
    loadingMessage.className = "text-red-500";
    console.error("Error loading watchlist:", error);
  });

  return container;
}