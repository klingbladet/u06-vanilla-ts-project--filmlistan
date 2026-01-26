import createMovieModal from "../../components/Modal";
import { deleteMovie, getMovies, updateMovie } from "../../services/movieApi";
import type { DatabaseMovie } from "../../types/movie";
import { ratingComponent } from "../../components/review-rating";

export default function watchlist(isLoggedIn: boolean): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-grey text-white";

  const inner = document.createElement("div");
  inner.className = "max-w-7xl mx-auto px-4 py-6";
  container.appendChild(inner);

  // --- Header Section ---
  const header = document.createElement("div");
  header.className = "flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8";
  
  const titleGroup = document.createElement("div");
  titleGroup.innerHTML = `
    <div class="inline-flex items-center rounded-lg bg-emerald-400/80 px-3 py-1 text-xs font-bold tracking-wide text-zinc-900 mb-2">
      WATCHLIST
    </div>
    <h1 class="text-3xl md:text-4xl font-semibold tracking-tight text-white/80">Filmer att se</h1>
    <p class="text-zinc-500 mt-1 text-sm">Här samlar du allt du vill se framöver.</p>
  `;
  
  const clearBtn = document.createElement("button");
  clearBtn.className = "md:flex items-center content-center rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-rose-500/60 transition hover:bg-rose-600/15 hover:text-rose-500/60 disabled:opacity-50 disabled:cursor-not-allowed";
  clearBtn.textContent = "Rensa hela listan";

  header.appendChild(titleGroup);
  header.appendChild(clearBtn);
  inner.appendChild(header);

  // --- Grid Section ---
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  inner.appendChild(grid);

  const loadingMessage = document.createElement("div");
  loadingMessage.className = "col-span-full py-12 text-center text-zinc-500 animate-pulse";
  loadingMessage.textContent = "Laddar din watchlist...";
  grid.appendChild(loadingMessage);

  // --- Logic ---

  function showEmptyMessage() {
    grid.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
        <div class="text-4xl mb-4">📺</div>
        <h3 class="text-lg font-semibold text-white">Din lista är tom</h3>
        <p class="text-zinc-400 text-sm mt-2 max-w-xs mx-auto">Gå till startsidan för att hitta och spara nya filmer.</p>
        <a href="/" class="mt-6 rounded-xl bg-red px-6 py-2 text-sm font-bold text-black transition hover:bg-red-800">
          Hitta filmer
        </a>
      </div>
    `;
    clearBtn.style.display = 'none';
  }

  // Load Data
  getMovies().then((movies: DatabaseMovie[]) => {
    loadingMessage.remove();
    const watchlistMovies = movies.filter(movie => movie.status === 'watchlist');

    if (watchlistMovies.length === 0) {
      showEmptyMessage();
      return;
    }

    // "Clear All" logic
    clearBtn.addEventListener('click', async () => {
      if (!confirm(`Är du säker på att du vill ta bort alla ${watchlistMovies.length} filmer?`)) {
        return;
      }
      clearBtn.disabled = true;
      clearBtn.textContent = "Rensar...";
      
      try {
        await Promise.all(watchlistMovies.map(movie => deleteMovie(movie.id)));
        showEmptyMessage();
      } catch (error) {
        console.error("Failed to clear watchlist", error);
        alert("Kunde inte rensa listan.");
      } finally {
        clearBtn.disabled = false;
        clearBtn.textContent = "Rensa hela listan";
      }
    });

    // Render Cards
    watchlistMovies.forEach((movie) => {
      grid.appendChild(createWatchlistCard(movie, () => {
        // Callback when a card is removed (to check if empty)
        if (grid.children.length === 0) showEmptyMessage();
      }));
    });

  }).catch((error) => {
    loadingMessage.textContent = "Kunde inte ladda filmerna. Försök igen senare.";
    loadingMessage.className = "col-span-full text-center text-rose-800/80 py-8";
    console.error("Error loading watchlist:", error);
  });

  return container;
}

/**
 * Creates a card specifically for the Watchlist view.
 * Style matches Home but functionality includes Delete & specific data.
 */
function createWatchlistCard(movie: DatabaseMovie, onRemove: () => void): HTMLElement {
  const card = document.createElement("article");
  card.className = "group relative overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 transition hover:ring-white/20";

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://placehold.co/500x750?text=No+Poster';

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "0.0";
  const addedDate = new Date(movie.date_added).toLocaleDateString('sv-SE');

  // Hybrid Method: innerHTML for structure/style
  card.innerHTML = `
    <div class="relative aspect-[2/3] bg-zinc-800">
      <img src="${imageUrl}" alt="${movie.title}" loading="lazy"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
      
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent transition duration-500 group-hover:scale-[1.03]"></div>
      
      <!-- Rating Badge -->
      <div class="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/10 backdrop-blur-sm">
        ⭐ ${rating}
      </div>

      <!-- Delete Button (Top Right) -->
      <button class="btn-delete absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white/70 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-rose-500 hover:text-white hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
      </button>
    </div>

    <div class="p-4 flex flex-col gap-3">
      <div>
        <h3 class="text-sm font-bold text-white line-clamp-1" title="${movie.title}">${movie.title}</h3>
        <p class="text-xs text-emerald-500/80 mt-1">Tillagd: ${addedDate}</p>
      </div>

      <button class="btn-watched w-full rounded-xl bg-red-500/75 px-3 py-2 text-xs font-bold text-zinc-900 transition hover:bg-red-500/55 active:scale-95">
        Markera som sedd
      </button>
    </div>
  `;

  // Attach Event Listeners

  // 1. Delete Action
  const deleteBtn = card.querySelector(".btn-delete") as HTMLButtonElement;
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation(); // Prevent modal open
    if(!confirm("Ta bort från listan?")) return;
    
    // Visual feedback
    card.style.opacity = "0.5";
    card.style.pointerEvents = "none";
    
    try {
      await deleteMovie(movie.id);
      card.remove();
      onRemove(); // Check if empty
    } catch (err) {
      console.error(err);
      alert("Kunde inte ta bort filmen.");
      card.style.opacity = "1";
    }
  });

  // 2. Mark Watched Action
  const watchedBtn = card.querySelector(".btn-watched") as HTMLButtonElement;
  watchedBtn.addEventListener("click", async (e) => {
    e.stopPropagation(); // Prevent modal open
    
    const originalText = watchedBtn.textContent;
    watchedBtn.textContent = "Sparar...";
    watchedBtn.disabled = true;

    try {
      await updateMovie(movie.id, { status: 'watched', date_watched: new Date().toISOString().split('T')[0] });
      // Animate out
      card.style.transform = "scale(0.9)";
      card.style.opacity = "0";
      setTimeout(() => {
        card.remove();
        onRemove();
      }, 300);
    } catch (err) {
      console.error(err);
      watchedBtn.textContent = "Fel!";
      setTimeout(() => {
        watchedBtn.textContent = originalText;
        watchedBtn.disabled = false;
      }, 2000);
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
      modal.innerHTML =`
              <button class="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 text-sm font-bold hover:bg-emerald-500 hover:text-black transition">
          + Watchlist
        </button>
        `
      const newWidget = ratingComponent(updatedMovie.personal_rating || 0, async (newRating) => {
         try {
           await updateMovie(updatedMovie.id, { personal_rating: newRating });
         } catch(e) { console.error(e); }
      });
      newWidget.style.color = 'white';
    });
    
    document.body.appendChild(modal);
    openModal();
  });

  return card;
}
