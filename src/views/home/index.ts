import type { TMDBMovie, DatabaseMovie } from "../../types/movie";
import { store, loadPopularMovies } from "../../lib/store";
import { SearchComponent } from "../../components/search";
import { addMovie, getMovies } from "../../services/movieApi";

/* =====================================
   HOME VIEW
===================================== */
export default function home(): HTMLElement {
  const container = document.createElement("div");
  container.className = "max-w-7xl mx-auto p-6";

  container.appendChild(SearchComponent());

  const heading = document.createElement("h2");
  heading.className = "text-3xl font-bold text-center my-8";
  container.appendChild(heading);

  const grid = document.createElement("div");
  grid.className =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
  container.appendChild(grid);

  let movies: TMDBMovie[] = [];
  let savedMovies: DatabaseMovie[] = [];

  /* ===== LOAD SAVED MOVIES (ONCE) ===== */
  getMovies().then((dbMovies) => {
    savedMovies = dbMovies;
  });

  /* ===== DECIDE WHAT TO SHOW ===== */
  if (store.isSearching) {
    heading.textContent = `Resultat för "${store.currentSearchQuery}"`;
    movies = store.searchResults;
  } else {
    heading.textContent = " Populära filmer";
    movies = store.popularMovies;

    if (movies.length === 0) {
      loadPopularMovies();
    }
  }

  if (movies.length === 0) {
    grid.innerHTML = `
      <p class="col-span-full text-center text-gray-500">
        Laddar filmer...
      </p>`;
  }

  movies.forEach((movie) => {
    const alreadySaved = savedMovies.some(
      (m) => m.tmdb_id === movie.id
    );
    grid.appendChild(createMovieCard(movie, alreadySaved));
  });

  /* ===== BUTTON HANDLING ===== */
  container.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn || btn.disabled) return;

    const movieId = Number(btn.dataset.id);
    const action = btn.dataset.action;

    const movie = movies.find((m) => m.id === movieId);
    if (!movie) return;

    btn.textContent = "Sparar...";
    btn.disabled = true;

    try {
      await addMovie({
        tmdb_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ?? "",
        release_date: movie.release_date ?? "",
        overview: movie.overview,
        status: action === "watchlist" ? "watchlist" : "watched",
      });

      btn.textContent = "✔ Klar";
      btn.className =
        "flex-1 bg-gray-400 text-white text-sm py-2 rounded cursor-not-allowed";

      showToast("Filmen sparades ✔");

    } catch (error) {
      btn.textContent = "Fel";
      btn.disabled = false;
      showToast("Något gick fel", false);
    }
  });

  return container;
}

/* =====================================
   MOVIE CARD
===================================== */
function createMovieCard(movie: TMDBMovie, disabled: boolean): HTMLElement {
  const card = document.createElement("div");
  card.className =
    "bg-white rounded-xl shadow hover:shadow-lg transition flex flex-col overflow-hidden";

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750?text=No+Image";

  /* ===== IMAGE WITH SKELETON ===== */
  const imageWrapper = document.createElement("div");
  imageWrapper.className =
    "relative w-full h-72 bg-gray-200 animate-pulse";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = movie.title;
  img.loading = "lazy";
  img.className =
    "w-full h-full object-cover opacity-0 transition-opacity duration-500";

  img.onload = () => {
    imageWrapper.classList.remove("animate-pulse");
    img.classList.remove("opacity-0");
  };

  imageWrapper.appendChild(img);

  /* ===== CONTENT ===== */
  const content = document.createElement("div");
  content.className = "p-4 flex flex-col flex-1";

  content.innerHTML = `
    <h3 class="font-bold text-lg mb-1">${movie.title}</h3>
    <p class="text-sm text-gray-500 mb-2">
       ${movie.vote_average.toFixed(1)}
    </p>
    <p class="text-sm text-gray-600 line-clamp-3 mb-4">
      ${movie.overview || "Ingen beskrivning."}
    </p>

    <div class="flex gap-2 mt-auto">
      <button
        data-id="${movie.id}"
        data-action="watchlist"
        ${disabled ? "disabled" : ""}
        class="flex-1 ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        } text-white text-sm py-2 rounded">
        + Watchlist
      </button>

      <button
        data-id="${movie.id}"
        data-action="watched"
        ${disabled ? "disabled" : ""}
        class="flex-1 ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white text-sm py-2 rounded">
        ✓ Watched
      </button>
    </div>
  `;

  card.appendChild(imageWrapper);
  card.appendChild(content);

  return card;
}

/* =====================================
   TOAST
===================================== */
function showToast(message: string, success = true) {
  const toast = document.createElement("div");
  toast.className = `
    fixed bottom-6 right-6 px-4 py-3 rounded shadow-lg text-white z-50
    ${success ? "bg-green-600" : "bg-red-600"}
  `;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

