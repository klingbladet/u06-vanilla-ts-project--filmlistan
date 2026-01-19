import type { TMDBMovie, DatabaseMovie } from "../../types/movie";
import { store, loadPopularMovies, ensurePopularCount } from "../../lib/store";
import { SearchComponent } from "../../components/search";
import createMovieModal from "../../components/Modal";
import { getMovies, upsertMovieStatusByTmdbId } from "../../services/movieApi";

export default function home(): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-zinc-950 text-white";

  const inner = document.createElement("div");
  inner.className = "max-w-7xl mx-auto px-4 py-6";
  container.appendChild(inner);

  // Mr hero here
  const hero = document.createElement("section");
  hero.className =
    "relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 ring-1 ring-white/10";
  hero.innerHTML = `
    <div class="p-6 md:p-10">
      <div class="inline-flex items-center rounded-lg bg-amber-400 px-3 py-1 text-xs font-extrabold tracking-wide text-black">
        FILMKOLLEN
      </div>

      <h1 class="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
        Hitta något att titta på.
        <span class="text-amber-400">Spara</span> dina favoriter.
      </h1>

      <p class="mt-3 max-w-2xl text-zinc-300">
        Välj 20/25/50/100 per sida och bläddra med Next/Prev.
      </p>
    </div>
  `;
  inner.appendChild(hero);

  // Serac
  const searchWrap = document.createElement("div");
  searchWrap.className = "mt-6";
  searchWrap.appendChild(SearchComponent());
  inner.appendChild(searchWrap);

  // CHIP
  const chips = document.createElement("div");
  chips.className = "mt-4 flex flex-wrap items-center gap-2";
  const chipBase =
    "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white";
  chips.innerHTML = `
    <button data-chip="popular" class="${chipBase} bg-amber-400 text-black border-amber-400 hover:bg-amber-300">Popular</button>
    <button data-chip="watchlist" class="${chipBase}">My Watchlist</button>
    <button data-chip="watched" class="${chipBase}">Watched</button>
  `;
  inner.appendChild(chips);

  // Heading of control
  const topRow = document.createElement("div");
  topRow.className = "mt-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between";
  inner.appendChild(topRow);

  const heading = document.createElement("h2");
  heading.className = "flex items-center gap-3 text-xl md:text-2xl font-extrabold";
  topRow.appendChild(heading);

  const controls = document.createElement("div");
  controls.className = "flex items-center gap-3";
  controls.innerHTML = `
    <label class="text-xs text-white/70">
      Per sida
      <select id="pageSize" class="ml-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none">
        <option value="20" selected>20</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </label>
    <div id="pageInfo" class="text-xs text-white/60"></div>
  `;
  topRow.appendChild(controls);

  // Grid
  const grid = document.createElement("div");
  grid.className = "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  inner.appendChild(grid);

  // Pager
  const pager = document.createElement("div");
  pager.className = "mt-6 flex items-center justify-between";
  pager.innerHTML = `
    <button id="prevBtn" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
      ← Prev
    </button>
    <button id="nextBtn" class="rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black transition hover:bg-amber-300">
      Next →
    </button>
  `;
  inner.appendChild(pager);

  const pageSizeSelect = controls.querySelector<HTMLSelectElement>("#pageSize")!;
  const pageInfo = controls.querySelector<HTMLDivElement>("#pageInfo")!;
  const prevBtn = pager.querySelector<HTMLButtonElement>("#prevBtn")!;
  const nextBtn = pager.querySelector<HTMLButtonElement>("#nextBtn")!;

  // S
  let activeChip: "popular" | "watchlist" | "watched" = "popular";
  let perPage = Number(pageSizeSelect.value);
  let page = 1;

  let fullList: TMDBMovie[] = [];
  let savedMovies: DatabaseMovie[] = [];

  const findDbMovieByTmdbId = (tmdbId: number) =>
    savedMovies.find((m) => m.tmdb_id === tmdbId);

  const setHeading = (text: string) => {
    heading.innerHTML = `
      <span class="h-6 w-1 rounded bg-amber-400"></span>
      <span>${text}</span>
    `;
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const updatePagerUI = () => {
    const total = fullList.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    pageInfo.textContent =
      total === 0 ? "0 filmer" : `${start}-${end} av ${total} • sida ${page}/${totalPages}`;

    prevBtn.disabled = page <= 1;
    prevBtn.classList.toggle("opacity-50", prevBtn.disabled);
    prevBtn.classList.toggle("cursor-not-allowed", prevBtn.disabled);

    nextBtn.disabled = page >= totalPages;
    nextBtn.classList.toggle("opacity-50", nextBtn.disabled);
    nextBtn.classList.toggle("cursor-not-allowed", nextBtn.disabled);
  };

  const render = () => {
    grid.innerHTML = "";

    if (fullList.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
          Inget att visa här ännu.
        </div>`;
      updatePagerUI();
      return;
    }

    const startIndex = (page - 1) * perPage;
    const pageItems = fullList.slice(startIndex, startIndex + perPage);

    pageItems.forEach((m) => {
      const dbMovie = findDbMovieByTmdbId(m.id);
      grid.appendChild(createMovieCard(m, dbMovie));
      

    });

    updatePagerUI();
  };

  const setChipActiveStyles = () => {
    chips.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
      const isActive = b.dataset.chip === activeChip;

      if (isActive) {
        b.classList.add("bg-amber-400", "text-black", "border-amber-400", "hover:bg-amber-300");
        b.classList.remove("bg-white/5", "text-white/80");
      } else {
        b.classList.remove("bg-amber-400", "text-black", "border-amber-400", "hover:bg-amber-300");
        b.classList.add("bg-white/5", "text-white/80");
      }
    });
  };

  const buildFullListForCurrentView = async () => {
    page = 1;

    // search över riders
    if (store.isSearching) {
      setHeading(`Resultat för "${store.currentSearchQuery}"`);
      fullList = store.searchResults;
      setChipActiveStyles();
      render();
      return;
    }

    if (activeChip === "popular") {
      setHeading("Populära just nu");

      if (store.popularMovies.length === 0) await loadPopularMovies(false);

      //   filmer  popular
      await ensurePopularCount(perPage);

      fullList = store.popularMovies;
      setChipActiveStyles();
      render();
      return;
    }

    if (activeChip === "watchlist") {
      setHeading("Min Watchlist");
      const list = savedMovies.filter((m) => m.status === "watchlist");
      fullList = list.map((m) => ({
        id: m.tmdb_id,
        title: m.title,
        poster_path: m.poster_path ?? "",
        release_date: m.release_date ?? "",
        vote_average: m.vote_average ?? 0,
        overview: m.overview ?? "",
      })) as unknown as TMDBMovie[];
      setChipActiveStyles();
      render();
      return;
    }

    setHeading("Watched");
    const list = savedMovies.filter((m) => m.status === "watched");
    fullList = list.map((m) => ({
      id: m.tmdb_id,
      title: m.title,
      poster_path: m.poster_path ?? "",
      release_date: m.release_date ?? "",
      vote_average: m.vote_average ?? 0,
      overview: m.overview ?? "",
    })) as unknown as TMDBMovie[];
    setChipActiveStyles();
    render();
  };

  // Load DB movies
  getMovies()
    .then((dbMovies) => {
      savedMovies = dbMovies;
      buildFullListForCurrentView();
    })
    .catch(() => buildFullListForCurrentView());

  buildFullListForCurrentView();

  // event
  chips.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    const chip = btn.dataset.chip as typeof activeChip | undefined;
    if (!chip) return;
    activeChip = chip;
    buildFullListForCurrentView();
    scrollToTop();
  });

  pageSizeSelect.addEventListener("change", () => {
    perPage = Number(pageSizeSelect.value);
    buildFullListForCurrentView();
    scrollToTop();
  });

  prevBtn.addEventListener("click", () => {
    if (page <= 1) return;
    page -= 1;
    render();
    scrollToTop();
  });

  nextBtn.addEventListener("click", async () => {
    const nextPage = page + 1;

    //  hämta flera sidor om det behövs tills nästa
    if (!store.isSearching && activeChip === "popular") {
      await ensurePopularCount(nextPage * perPage);
      fullList = store.popularMovies;
    }

    page = nextPage;
    render();
    scrollToTop();
  });

  // Save buttons
  container.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn || btn.disabled) return;

    const movieId = Number(btn.dataset.id);
    const action = btn.dataset.action as "watchlist" | "watched" | undefined;
    if (!action) return;

    const tmdbMovie = fullList.find((m) => m.id === movieId);
    if (!tmdbMovie) return;

    const existingDbMovie = findDbMovieByTmdbId(tmdbMovie.id);

    if (existingDbMovie?.status === "watched") {
      showToast("Filmen är redan Watched");
      return;
    }

    const originalText = btn.textContent ?? "";
    btn.textContent = "Sparar...";
    btn.disabled = true;

    try {
      const updated = await upsertMovieStatusByTmdbId({
        tmdbMovie,
        status: action,
        existingDbMovie,
      });

      const idx = savedMovies.findIndex((m) => m.tmdb_id === updated.tmdb_id);
      if (idx >= 0) savedMovies[idx] = updated;
      else savedMovies = [updated, ...savedMovies];

      showToast(action === "watched" ? "Markerad som Watched ✅" : "Sparad i Watchlist ✔");
      buildFullListForCurrentView();
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = originalText;
      showToast("Något gick fel", false);
    }
  });

  return container;
}

function createMovieCard(movie: TMDBMovie, dbMovie?: DatabaseMovie): HTMLElement {
  const card = document.createElement("article");
  card.className =
    "group overflow-hidden rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 transition hover:ring-white/20";

  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://placehold.co/500x750?text=No+Image";

  const isSaved = !!dbMovie;
  const isWatchlist = dbMovie?.status === "watchlist";
  const isWatched = dbMovie?.status === "watched";

  const watchlistDisabled = isSaved;
  const watchedDisabled = isWatched;

  const watchedLabel = isWatchlist ? "Mark as watched" : isWatched ? "Watched ✅" : "✓ Watched";

  const rating = Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : "0.0";
  const release = movie.release_date ?? "";

  card.innerHTML = `
    <div class="relative aspect-[2/3] bg-zinc-800">
      <img src="${imageUrl}" alt="${movie.title}" loading="lazy"
        class="h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-[1.03]" />
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
      <div class="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/10">
        ⭐ ${rating}
      </div>
    </div>

    <div class="p-3">
      <h3 class="text-sm font-semibold text-white line-clamp-2">${movie.title}</h3>
      <p class="mt-1 text-xs text-white/55">${release}</p>

      <div class="mt-3 flex gap-2">
        <button
          data-id="${movie.id}"
          data-action="watchlist"
          ${watchlistDisabled ? "disabled" : ""}
          class="flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition
            ${watchlistDisabled ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-emerald-400 text-black hover:bg-emerald-300"}">
          ${isSaved ? "Saved" : "+ Watchlist"}
        </button>

        <button
          data-id="${movie.id}"
          data-action="watched"
          ${watchedDisabled ? "disabled" : ""}
          class="flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition
            ${watchedDisabled ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-amber-400 text-black hover:bg-amber-300"}">
          ${watchedLabel}
        </button>
      </div>
    </div>
  `;

  const img = card.querySelector("img")!;
  img.addEventListener("load", () => img.classList.remove("opacity-0"));

  card.addEventListener('click', (event) => {
    // Om klicket var på en knapp inuti kortet, gör ingenting.
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    // 1. Skapa modalen för den här specifika filmen
    const { modal, openModal } = createMovieModal(movie);

    // 2. Lägg till modalen i dokumentet
    document.body.appendChild(modal);

      // 3. Öppna modalen
    openModal();
  });


  return card;
}

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
