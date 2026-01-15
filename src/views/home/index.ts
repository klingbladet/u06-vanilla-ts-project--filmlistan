import type { TMDBMovie, DatabaseMovie } from "../../types/movie";
import { store, loadPopularMovies } from "../../lib/store";
import { SearchComponent } from "../../components/search";
import { getMovies, upsertMovieStatusByTmdbId } from "../../services/movieApi";

/* =====================================
   HOME VIEW (IMDB-LIKE)
===================================== */
export default function home(): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-zinc-950 text-white";

  const inner = document.createElement("div");
  inner.className = "max-w-7xl mx-auto px-4 py-6";
  container.appendChild(inner);

  /* ---------- HERO ---------- */
  const hero = document.createElement("section");
  hero.className =
    "relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 ring-1 ring-white/10";
  hero.innerHTML = `
    <div class="p-6 md:p-10">
      <div class="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-1 text-xs font-extrabold tracking-wide text-black">
       FILMKOLLEN
      </div>


      <h1 class="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
        Hitta något att titta på.
        <span class="text-amber-400">Spara</span> dina favoriter.
      </h1>


      <p class="mt-3 max-w-2xl text-zinc-300">
        Sök bland populära filmer och markera dem som watched.
      </p>
    </div>
  `;
  inner.appendChild(hero);

  /* ---------- SEARCH ---------- */
  const searchWrap = document.createElement("div");
  searchWrap.className = "mt-6";
  searchWrap.appendChild(SearchComponent());
  inner.appendChild(searchWrap);

  /* ---------- HEADING ---------- */
  const heading = document.createElement("h2");
  heading.className = "mt-10 flex items-center gap-3 text-xl md:text-2xl font-bold";
  inner.appendChild(heading);

  /* ---------- MOVIE ROW (IMDB SCROLL) ---------- */
  const row = document.createElement("div");
  row.className =
    "mt-6 flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
  inner.appendChild(row);

  let movies: TMDBMovie[] = [];
  let savedMovies: DatabaseMovie[] = [];

  const findDbMovieByTmdbId = (tmdbId: number) =>
    savedMovies.find((m) => m.tmdb_id === tmdbId);

  const render = () => {
    row.innerHTML = "";

    if (movies.length === 0) {
      row.innerHTML = `
        <div class="w-full text-center text-zinc-400 py-10">
          Laddar filmer...
        </div>`;
      return;
    }

    movies.forEach((m) => {
      const dbMovie = findDbMovieByTmdbId(m.id);
      row.appendChild(createMovieCard(m, dbMovie));
    });
  };

  /* ---------- LOAD SAVED MOVIES ---------- */
  getMovies()
    .then((dbMovies) => {
      savedMovies = dbMovies;
      render();
    })
    .catch(() => {
      // om backend failar, rendera ändå
      render();
    });

  /* ---------- DECIDE WHAT TO SHOW ---------- */
  if (store.isSearching) {
    heading.innerHTML = `
      <span class="h-6 w-1 rounded bg-amber-400"></span>
      <span>Resultat för "${store.currentSearchQuery}"</span>
    `;
    movies = store.searchResults;
  } else {
    heading.innerHTML = `
      <span class="h-6 w-1 rounded bg-amber-400"></span>
      <span>Populära filmer</span>
    `;
    movies = store.popularMovies;

    if (movies.length === 0) {
      loadPopularMovies();
    }
  }

  render();

  /* ---------- CLICK HANDLING ---------- */
  container.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn || btn.disabled) return;

    const movieId = Number(btn.dataset.id);
    const action = btn.dataset.action as "watchlist" | "watched" | undefined;
    if (!action) return;

    const tmdbMovie = movies.find((m) => m.id === movieId);
    if (!tmdbMovie) return;

    const existingDbMovie = findDbMovieByTmdbId(tmdbMovie.id);

    // Om redan watched => gör inget
    if (existingDbMovie?.status === "watched") {
      showToast("Filmen är redan Watched ✅");
      return;
    }

    // UI feedback
    const originalText = btn.textContent ?? "";
    btn.textContent = "Sparar...";
    btn.disabled = true;

    try {
      const updated = await upsertMovieStatusByTmdbId({
        tmdbMovie,
        status: action,
        existingDbMovie,
      });

      // uppdatera savedMovies lokalt (ersätt eller lägg till)
      const idx = savedMovies.findIndex((m) => m.tmdb_id === updated.tmdb_id);
      if (idx >= 0) savedMovies[idx] = updated;
      else savedMovies = [updated, ...savedMovies];

      showToast(action === "watched" ? "Markerad som Watched ✅" : "Sparad i Watchlist ✔");
      render();
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = originalText;
      showToast("Något gick fel", false);
    }
  });

  return container;
}

/* =====================================
   MOVIE CARD (DARK, SMART BUTTONS)
   - Om dbMovie finns:
       - status=watchlist => visa "Mark as watched" + disable watchlist-btn
       - status=watched   => disable båda + visa "Watched ✅"
   - Om dbMovie inte finns:
       - båda aktiva
===================================== */
function createMovieCard(movie: TMDBMovie, dbMovie?: DatabaseMovie): HTMLElement {
  const card = document.createElement("article");
  card.className =
    "group w-[170px] shrink-0 overflow-hidden rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 hover:ring-white/20 transition";

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750?text=No+Image";

  /* ---------- IMAGE ---------- */
  const imageWrapper = document.createElement("div");
  imageWrapper.className = "relative aspect-[2/3] w-full bg-zinc-800 animate-pulse";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = movie.title;
  img.loading = "lazy";
  img.className =
    "h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:scale-[1.02]";

  img.onload = () => {
    imageWrapper.classList.remove("animate-pulse");
    img.classList.remove("opacity-0");
  };

  imageWrapper.appendChild(img);

  /* ---------- CONTENT ---------- */
  const content = document.createElement("div");
  content.className = "p-3 flex flex-col gap-2";

  const rating = Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : "-";
  const release = movie.release_date ?? "";

  // Button states
  const isSaved = !!dbMovie;
  const isWatchlist = dbMovie?.status === "watchlist";
  const isWatched = dbMovie?.status === "watched";

  const watchlistDisabled = isSaved; // om den finns i db => blockera add igen (undvik 409)
  const watchedDisabled = isWatched; // om watched => lås watched

  const watchedLabel = isWatchlist ? "Mark as watched" : isWatched ? "Watched ✅" : "✓ Watched";

  content.innerHTML = `
    <h3 class="text-sm font-semibold text-white line-clamp-2">${movie.title}</h3>

    <p class="text-xs text-zinc-400">
      ⭐ ${rating} ${release ? `• ${release}` : ""}
    </p>

    <p class="text-xs text-zinc-300 line-clamp-3">
      ${movie.overview || "Ingen beskrivning."}
    </p>

    <div class="mt-1 flex gap-2">
      <button
        data-id="${movie.id}"
        data-action="watchlist"
        ${watchlistDisabled ? "disabled" : ""}
        class="flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition
          ${
            watchlistDisabled
              ? "bg-zinc-700 text-zinc-300 cursor-not-allowed"
              : "bg-emerald-500 text-black hover:bg-emerald-400"
          }"
      >
        ${isSaved ? "Saved" : "+ Watchlist"}
      </button>

      <button
        data-id="${movie.id}"
        data-action="watched"
        ${watchedDisabled ? "disabled" : ""}
        class="flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition
          ${
            watchedDisabled
              ? "bg-zinc-700 text-zinc-300 cursor-not-allowed"
              : "bg-amber-400 text-black hover:bg-amber-300"
          }"
      >
        ${watchedLabel}
      </button>
    </div>
  `;

  card.appendChild(imageWrapper);
  card.appendChild(content);

  return card;
}

/* =====================================
   TOAST (DARK)
===================================== */
function showToast(message: string, success = true) {
  const toast = document.createElement("div");
  toast.className = `
    fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm z-50
    ring-1 ring-white/10
    ${success ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"}
  `;
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
