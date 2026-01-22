import { getMovies, deleteMovie, updateMovie } from "../../services/movieApi";
import createMovieModal from "../../components/Modal";
import type { DatabaseMovie } from "../../types/movie";
import { ratingComponent } from "../../components/review-rating";

export default function watched(isLoggedIn: boolean): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-zinc-950 text-white";

  const inner = document.createElement("div");
  inner.className = "max-w-7xl mx-auto px-4 py-6";
  container.appendChild(inner);

  const header = document.createElement("div");
  header.className = "flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8";

  const titleGroup = document.createElement("div");
  titleGroup.innerHTML = `
    <div class="inline-flex items-center rounded-lg bg-amber-400 px-3 py-1 text-xs font-extrabold tracking-wide text-black mb-2">
      HISTORY
    </div>
    <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">Sedda filmer</h1>
    <p class="text-zinc-400 mt-1 text-sm">Din historik och dina recensioner.</p>
  `;
  
  const clearBtn = document.createElement("button");
  clearBtn.className = "rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50 disabled:cursor-not-allowed";
  clearBtn.textContent = "Rensa hela listan";

  header.appendChild(titleGroup);
  header.appendChild(clearBtn);
  inner.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  inner.appendChild(grid);

  const loadingMessage = document.createElement("div");
  loadingMessage.className = "col-span-full py-12 text-center text-zinc-500 animate-pulse";
  loadingMessage.textContent = "Hämtar historik...";
  grid.appendChild(loadingMessage);

  function showEmptyMessage() {
    grid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
        <div class="text-4xl mb-4">🎬</div>
        <h3 class="text-lg font-bold text-white">Inga sedda filmer än</h3>
        <p class="text-zinc-400 text-sm mt-2">När du markerar filmer som "Watched" hamnar de här.</p>
      </div>
    `;
  }

  getMovies().then((movies: DatabaseMovie[]) => {
    loadingMessage.remove();
    const watchedMovies = movies.filter(movie => movie.status === 'watched');
    
    if (watchedMovies.length === 0) {
      showEmptyMessage();
      return;
    }

    clearBtn.addEventListener('click', async () => {
      if (!confirm(`Är du säker på att du vill ta bort alla ${watchedMovies.length} filmer?`)) {
        return;
      }
      clearBtn.disabled = true;
      clearBtn.textContent = "Rensar...";
      
      try {
        await Promise.all(watchedMovies.map(movie => deleteMovie(movie.id)));
        showEmptyMessage();
      } catch (error) {
        console.error("Failed to clear watchlist", error);
        alert("Kunde inte rensa listan.");
      } finally {
        clearBtn.disabled = false;
        clearBtn.textContent = "Rensa hela listan";
      }
    });
    
    watchedMovies.forEach((movie) => {
      grid.appendChild(createWatchedCard(movie, () => {
         if (grid.children.length === 0) showEmptyMessage();
      }));
    });
  })
  .catch((error) => {
    loadingMessage.textContent ="Kunde inte ladda historik";
    loadingMessage.className = "col-span-full text-center text-rose-500 py-8";
    console.error(error);
  });

  return container;
}

function createWatchedCard(movie: DatabaseMovie, onRemove: () => void): HTMLElement {
  const card = document.createElement("article");
  card.className = "group relative overflow-hidden rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 transition hover:ring-white/20 flex flex-col";

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://placehold.co/500x750?text=No+Poster';
  
  const dateWatched = movie.date_watched ? new Date(movie.date_watched).toLocaleDateString('sv-SE') : 'Okänt datum';

  card.innerHTML = `
    <div class="poster-container relative aspect-[2/3] w-full bg-zinc-800 shrink-0 cursor-pointer overflow-hidden">
      <img src="${imageUrl}" alt="${movie.title}" loading="lazy"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>

      <button class="btn-delete absolute right-3 top-3 z-30 rounded-full bg-black/60 p-2 text-white/70 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-rose-500 hover:text-white hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
      </button>
    </div>

    <div class="p-4 flex flex-col gap-4 flex-1">
      <div>
        <h3 class="text-lg font-bold text-white line-clamp-1">${movie.title}</h3>
        <p class="text-xs text-zinc-500">Sedd: ${dateWatched}</p>
      </div>

      <div class="rating-slot flex justify-center py-2 bg-white/5 rounded-lg"></div>
      <div class="review-slot"></div>
    </div>
  `;

  const ratingSlot = card.querySelector('.rating-slot') as HTMLElement;
  const ratingWidget = ratingComponent(movie.personal_rating || 0, async(newRating) => {
    try {
      await updateMovie(movie.id,  { personal_rating: newRating });
    } catch (err) {
      console.log("Failed to update rating:", err);
      alert("Kunde inte spara betyget.");
    }
    });

  ratingSlot.appendChild(ratingWidget);

  ratingSlot.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  const deleteBtn = card.querySelector(".btn-delete") as HTMLButtonElement;
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if(!confirm("Ta bort från historiken?")) return;
    
    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";
    
    try {
      await deleteMovie(movie.id);
      card.remove();
      onRemove();
    } catch (err) {
      console.error(err);
      alert("Kunde inte ta bort filmen.");
      card.style.opacity = "1";
      card.style.pointerEvents = "auto";
    }
  });


  card.addEventListener("click", () => {
    // Convert DatabaseMovie to TMDBMovie structure for the modal
    const tmdbFormat = {
      id: movie.tmdb_id,
      title: movie.title,
      overview: movie.overview || "",
      poster_path: movie.poster_path || "",
      release_date: movie.release_date || "",
      vote_average: movie.vote_average || 0,
      genre_ids: [],
    };

    const { modal, openModal } = createMovieModal(tmdbFormat, movie, (updatedMovie) => {
      // Refresh the card's rating widget when modal updates
      const newWidget = ratingComponent(updatedMovie.personal_rating || 0, async (newRating) => {
         try {
           await updateMovie(updatedMovie.id, { personal_rating: newRating });
         } catch(e) { console.error(e); }
      });
      newWidget.style.color = 'white';
      
      ratingSlot.innerHTML = '';
      ratingSlot.appendChild(newWidget);
    });
    
    document.body.appendChild(modal);
    openModal();
  });

  return card;
}
