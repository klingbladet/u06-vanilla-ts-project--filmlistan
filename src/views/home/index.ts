import type { TMDBMovie, DatabaseMovie } from "../../types/movie";
import { store, loadPopularMovies, ensurePopularCount } from "../../lib/store";
import { SearchComponent } from "../../components/search";
import { getMovies, upsertMovieStatusByTmdbId } from "../../services/movieApi";
import { isLoggedIn } from "../../lib/auth";
import { getFavorites, isFavorite, toggleFavorite } from "../../lib/favorites";
import { Icons } from "../../components/icons";

export default function home(): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-zinc-950 text-white";

  const inner = document.createElement("div");
  inner.className = "max-w-7xl mx-auto px-4 py-6";
  container.appendChild(inner);

  
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
        Sök filmer och spara i Watchlist, Favoriter eller markera som Watched.
      </p>
    </div>

    <!-- cinema fade -->
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950/90 to-transparent"></div>
  `;
  inner.appendChild(hero);

  /* - SEARCH - */
  const searchWrap = document.createElement("div");
  searchWrap.className = "mt-6";
  searchWrap.appendChild(SearchComponent());
  inner.appendChild(searchWrap);

  /* - CHIPS - */
  const chips = document.createElement("div");
  chips.className = "mt-4 flex flex-wrap items-center gap-2";
  const chipBase =
    "rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white";
  chips.innerHTML = `
    <button data-chip="popular" class="${chipBase} bg-amber-400 text-black border-amber-400 hover:bg-amber-300">Popular</button>
    <button data-chip="watchlist" class="${chipBase}">My Watchlist</button>
    <button data-chip="watched" class="${chipBase}">Watched</button>
    <button data-chip="favorites" class="${chipBase}">Favoriter</button>
  `;
  inner.appendChild(chips);

  
  const topRow = document.createElement("div");
  topRow.className = "mt-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between";
  inner.appendChild(topRow);

  const heading = document.createElement("h2");
  heading.className = "flex items-center gap-3 text-xl md:text-2xl font-extrabold";
  topRow.appendChild(heading);

  const controls = document.createElement("div");
  controls.className = "flex flex-wrap items-center gap-3";
  controls.innerHTML = `
    <label class="text-xs text-white/70">
      Per sida
      <select id="pageSize" class="ml-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none">
        <option value="20">20</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </label>

    <label class="text-xs text-white/70">
      Sortera
      <select id="sort" class="ml-2 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white outline-none">
        <option value="popular" selected>Popular</option>
        <option value="rating">Rating</option>
        <option value="release">Release</option>
      </select>
    </label>

    <div id="pageInfo" class="text-xs text-white/60"></div>
  `;
  topRow.appendChild(controls);

  const pageSizeSelect = controls.querySelector<HTMLSelectElement>("#pageSize")!;
  const sortSelect = controls.querySelector<HTMLSelectElement>("#sort")!;
  const pageInfo = controls.querySelector<HTMLDivElement>("#pageInfo")!;

  
  const savedPerPage = Number(localStorage.getItem("filmkollen_perPage") || "25");
  const perPageInit = [20, 25, 50, 100].includes(savedPerPage) ? savedPerPage : 25;
  pageSizeSelect.value = String(perPageInit);

  /* - GRID WRAP + EDGE FADES - */
  const gridWrap = document.createElement("div");
  gridWrap.className = "relative mt-6";
  inner.appendChild(gridWrap);

  gridWrap.innerHTML = `
    <div class="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-zinc-950 to-transparent"></div>
    <div class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-zinc-950 to-transparent"></div>
  `;

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  gridWrap.appendChild(grid);

  /* - sidor - */
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

  const prevBtn = pager.querySelector<HTMLButtonElement>("#prevBtn")!;
  const nextBtn = pager.querySelector<HTMLButtonElement>("#nextBtn")!;

  /* -STATE - */
  let activeChip: "popular" | "watchlist" | "watched" | "favorites" = "popular";
  let perPage = perPageInit;
  let page = 1;

  let fullList: TMDBMovie[] = [];
  let savedMovies: DatabaseMovie[] = [];
  let isLoading = false;

  const findDbMovieByTmdbId = (tmdbId: number) =>
    savedMovies.find((m) => m.tmdb_id === tmdbId);

  const setHeading = (text: string) => {
    heading.innerHTML = `
      <span class="h-6 w-1 rounded bg-amber-400"></span>
      <span>${text}</span>
    `;
  };

  const updatePagerUI = () => {
    const total = fullList.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    pageInfo.textContent =
      total === 0 ? "0 filmer" : `${start}-${end} av ${total} • sida ${page}/${totalPages}`;

    prevBtn.disabled = total === 0 || page <= 1 || isLoading;
    nextBtn.disabled = total === 0 || page >= totalPages || isLoading;

    prevBtn.classList.toggle("opacity-50", prevBtn.disabled);
    prevBtn.classList.toggle("cursor-not-allowed", prevBtn.disabled);
    nextBtn.classList.toggle("opacity-50", nextBtn.disabled);
    nextBtn.classList.toggle("cursor-not-allowed", nextBtn.disabled);
  };

  const sortList = (list: TMDBMovie[]) => {
    const mode = sortSelect.value;
    const copy = [...list];

    if (mode === "rating") copy.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    if (mode === "release")
      copy.sort((a, b) =>
        String(b.release_date ?? "").localeCompare(String(a.release_date ?? ""))
      );

    return copy;
  };

  /* - Skeleton loaders - */
  function renderSkeleton(count: number) {
    grid.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const sk = document.createElement("div");
      sk.className = "overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 animate-pulse";
      sk.innerHTML = `
        <div class="aspect-[2/3] bg-white/5"></div>
        <div class="p-3 space-y-2">
          <div class="h-4 w-3/4 rounded bg-white/10"></div>
          <div class="h-3 w-1/2 rounded bg-white/10"></div>
          <div class="h-8 w-full rounded bg-white/10"></div>
        </div>
      `;
      grid.appendChild(sk);
    }
  }

  const render = () => {
    grid.innerHTML = "";

    if (isLoading) {
      renderSkeleton(Math.min(perPage, 20));
      updatePagerUI();
      return;
    }

    if (fullList.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
          Inget att visa här ännu.
        </div>`;
      updatePagerUI();
      return;
    }

    const sorted = sortList(fullList);
    const startIndex = (page - 1) * perPage;
    const pageItems = sorted.slice(startIndex, startIndex + perPage);

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
    setChipActiveStyles();

    if (store.isSearching) {
      setHeading(`Resultat för "${store.currentSearchQuery}"`);
      fullList = store.searchResults;
      isLoading = false;
      render();
      return;
    }

    if (activeChip === "popular") {
      setHeading("Populära just nu");
      isLoading = true;
      render();
      try {
        if (store.popularMovies.length === 0) await loadPopularMovies(false);
        await ensurePopularCount(perPage);
        fullList = store.popularMovies;
      } finally {
        isLoading = false;
        render();
      }
      return;
    }

    if (activeChip === "favorites") {
      setHeading("Mina favoriter");
      fullList = getFavorites();
      isLoading = false;
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
      isLoading = false;
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
    isLoading = false;
    render();
  };

  getMovies()
    .then((dbMovies) => {
      savedMovies = dbMovies;
      buildFullListForCurrentView();
    })
    .catch(() => buildFullListForCurrentView());

  buildFullListForCurrentView();

  chips.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    const chip = btn.dataset.chip as typeof activeChip | undefined;
    if (!chip) return;
    activeChip = chip;
    buildFullListForCurrentView();
  });

  pageSizeSelect.addEventListener("change", () => {
    perPage = Number(pageSizeSelect.value);
    localStorage.setItem("filmkollen_perPage", String(perPage));
    buildFullListForCurrentView();
  });

  sortSelect.addEventListener("change", () => {
    page = 1;
    render();
  });

  prevBtn.addEventListener("click", () => {
    if (prevBtn.disabled) return;
    page -= 1;
    render();
  });

  nextBtn.addEventListener("click", async () => {
    if (nextBtn.disabled) return;
    const nextPage = page + 1;

    if (!store.isSearching && activeChip === "popular") {
      isLoading = true;
      render();
      await ensurePopularCount(nextPage * perPage);
      fullList = store.popularMovies;
      isLoading = false;
    }

    page = nextPage;
    render();
  });

  // Click favorite / watchlist / watched
  container.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest("button") as HTMLButtonElement | null;
    if (!btn || btn.disabled) return;

    const movieId = Number(btn.dataset.id);
    const action = btn.dataset.action as "watchlist" | "watched" | "favorite" | undefined;
    if (!action) return;

    const tmdbMovie = fullList.find((m) => m.id === movieId);
    if (!tmdbMovie) return;

    // Favorite
    if (action === "favorite") {
      if (!isLoggedIn()) {
        showToast("Du måste logga in först.", false);
        window.history.pushState({}, "", "/login");
        window.dispatchEvent(new PopStateEvent("popstate"));
        return;
      }
      toggleFavorite(tmdbMovie);
      heartBurstAt(btn);
      showToast("Favorit uppdaterad");
      render();
      return;
    }

    // Watchlist / watched
    if (!isLoggedIn()) {
      showToast("Du måste logga in först.", false);
      window.history.pushState({}, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }

    const existingDbMovie = findDbMovieByTmdbId(tmdbMovie.id);
    if (existingDbMovie?.status === "watched") {
      showToast("Redan Watched ✅");
      return;
    }

    btn.textContent = "Sparar...";
    btn.disabled = true;

    try {
      await upsertMovieStatusByTmdbId({
        tmdbMovie,
        status: action,
        existingDbMovie,
      });

      savedMovies = await getMovies();
      buildFullListForCurrentView();
    } catch {
      btn.disabled = false;
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

  const status = dbMovie?.status;
  const fav = isFavorite(movie.id);

  const watchlistDisabled = Boolean(dbMovie);
  const watchedDisabled = status === "watched";

  const rating = Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : "0.0";
  const release = movie.release_date ?? "";

  const badge =
    status === "watchlist"
      ? `<span class="rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-bold text-black">WATCHLIST</span>`
      : status === "watched"
      ? `<span class="rounded-full bg-amber-400 px-2 py-1 text-[10px] font-bold text-black">WATCHED</span>`
      : fav
      ? `<span class="rounded-full bg-rose-500 px-2 py-1 text-[10px] font-bold text-white">FAVORIT</span>`
      : "";

  card.innerHTML = `
    <div class="relative aspect-[2/3] bg-zinc-800">
      <img src="${imageUrl}" alt="${movie.title}" loading="lazy"
        class="h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-[1.03]" />
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>

      <div class="absolute left-3 top-3 flex items-center gap-2">
        <span class="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/10">
          ${Icons.starSolid({ className: "h-3.5 w-3.5 text-amber-400" })}
          ${rating}
        </span>
        ${badge}
      </div>

      <div class="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 transition group-hover:opacity-100 group-hover:translate-y-0">
        <div class="grid gap-2 rounded-xl border border-white/10 bg-black/40 p-2 backdrop-blur">
          <div class="flex gap-2">
            <button
              data-id="${movie.id}"
              data-action="watchlist"
              ${watchlistDisabled ? "disabled" : ""}
              class="flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition
                ${watchlistDisabled ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-emerald-400 text-black hover:bg-emerald-300"}">
              <span class="inline-flex items-center justify-center gap-2">
                ${Icons.bookmark({ className: "h-4 w-4" })}
                Watchlist
              </span>
            </button>

            <button
              data-id="${movie.id}"
              data-action="watched"
              ${watchedDisabled ? "disabled" : ""}
              class="flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition
                ${watchedDisabled ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-amber-400 text-black hover:bg-amber-300"}">
              <span class="inline-flex items-center justify-center gap-2">
                ${Icons.check({ className: "h-4 w-4" })}
                Watched
              </span>
            </button>
          </div>

          <button
            data-id="${movie.id}"
            data-action="favorite"
            class="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-semibold text-white/80 hover:bg-white/10">
            <span class="inline-flex items-center justify-center gap-2">
              ${
                fav
                  ? Icons.heartSolid({ className: "h-4 w-4 text-rose-500" })
                  : Icons.heart({ className: "h-4 w-4 text-rose-400" })
              }
              ${fav ? "Ta bort favorit" : "Lägg i favoriter"}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="p-3">
      <h3 class="text-sm font-semibold text-white line-clamp-2">${movie.title}</h3>
      <p class="mt-1 text-xs text-white/55">${release}</p>
    </div>
  `;

  const img = card.querySelector("img")!;
  img.addEventListener("load", () => img.classList.remove("opacity-0"));

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
  setTimeout(() => toast.remove(), 2500);
}

// röd hjärta
function heartBurstAt(btn: HTMLElement) {
  const r = btn.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + 8;

  const el = document.createElement("div");
  el.className = "heart-burst";
  el.textContent = "❤";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = "#f43f5e"; 
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 700);
}
