import type { TMDBMovie, DatabaseMovie, Genre } from "../../types/movie.ts"; // Merged import: added Genre
import { store, loadPopularMovies, loadRecommendations, ensurePopularCount, setRenderCallback } from "../../lib/store"; // Merged import: added loadRecommendations, ensurePopularCount
import { SearchComponent } from "../../components/search";
import createMovieModal from "../../components/Modal";
import { getMovies, upsertMovieStatusByTmdbId } from "../../services/movieApi";
import { getFavorites, isFavorite, toggleFavorite, syncFavoriteToDatabase } from "../../lib/favorites";
import { Icons } from "../../components/icons";
import { getGenres } from '../../services/tmdbApi'; // Keep getGenres
import { createFilterComponent } from '../../components/filter'; // Keep createFilterComponent

export default function home(isLoggedIn: boolean): HTMLElement {
  const container = document.createElement("div");
  container.className = "home-view p-4 max-w-7xl mx-auto";

  // Hero Image / Banner

  //Image container
  
  const heroImage = document.createElement("img");
  heroImage.className = "mb-6 h-64 w-full rounded-2xl object-cover border border-white/10 bg-black/40 shadow-inner brightness-70";
  heroImage.src = "/img/banner/dune-2-banner-1.jpg"; 
  heroImage.alt = "Blade Runner Hero Banner";

  const heroImages = [
    { src: "/img/banner/bladerunner-banner.jpg", alt: "Blade Runner Hero"},
    { src: "/img/banner/dune-2-banner-1.jpg", alt: "Dune 2 Banner 1"},
    { src: "/img/banner/dune-2-banner-2.jpg", alt: "Dune 2 Banner 2"},
    { src: "/img/banner/killers-of-the-flower-moon-banner.jpg", alt: "Killers of the flower Moon Banner"},
  ];

  const updateHeroImage= (imgElement: HTMLImageElement) => {
    const currentHour = new Date().getSeconds();
    const imageIndex = currentHour % heroImages.length;
    const selectedImage = heroImages[imageIndex]

    imgElement.src = selectedImage.src;
    imgElement.alt = selectedImage.alt;
  };

  updateHeroImage(heroImage)

  setInterval(() => updateHeroImage(heroImage), 100000);

  container.appendChild(heroImage);

  // Lägg till sökfältet högst upp
  container.appendChild(SearchComponent());

  // Inner wrapper för hela innehållet
  const inner = document.createElement("div");
  inner.className = "space-y-4";
  container.appendChild(inner);

  const chipsAndControles = document.createElement("div");
  chipsAndControles.className = "flex flex-wrap items-center justify-between gap-4";
  inner.appendChild(chipsAndControles);

  // Top row med rubrik, chips och kontroller
  const topRow = document.createElement("div");
  topRow.className = "flex flex-wrap items-center justify-between gap-4";
  inner.appendChild(topRow);

  // Rubrik (sätts dynamiskt av setHeading) - from dev
  const heading = document.createElement("h2");
  heading.className = "flex items-center gap-3 text-xl font-bold text-white/80";
  topRow.appendChild(heading);

  // Chips för att filtrera (Popular, Rekommenderat) - from dev
  const chips = document.createElement("div");
  chips.className = "flex flex-wrap gap-2";
  chips.innerHTML = `
    <button data-chip="popular" class="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold bg-red-500/75 transition text-white/80 hover:bg-red-500/55">
      Populära
    </button>
    <button data-chip="recommendations" class="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold transition bg-red-500/75 text-white/80 hover:bg-red-500/55">
      ⭐ Rekommenderat
    </button>
    <button data-chip="favorites" class="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold transition bg-red-500/75 text-white/80 hover:bg-red-500/55">
      ❤️ Favoriter
    </button>
  `;
  chipsAndControles.appendChild(chips);

  // Kontroller (per sida dropdown + page info) - from dev
  const controls = document.createElement("div");
  controls.className = "flex flex-wrap items-center gap-3";
  controls.innerHTML = `
    <label class="text-xs text-white/70">
      Per sida
      <select id="pageSize" class="ml-2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs text-white outline-none">
        <option value="20">20</option>
        <option value="25">25</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
    </label>

    <label class="text-xs text-white/70">
      Sortera
      <select id="sort" class="ml-2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs text-white outline-none">
        <option value="popular" selected>Popular</option>
        <option value="rating">Rating</option>
        <option value="release">Release</option>
      </select>
    </label>

    <div id="pageInfo" class="text-xs text-white/60"></div>
  `;
  chipsAndControles.appendChild(controls);

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

  // --- Start Filter Component Re-integration ---
  // Skapa en temporär placeholder för filtren som visas medan de laddas
  const filterContainerPlaceholder = document.createElement('div');
  filterContainerPlaceholder.className = "mt-6 text-center text-zinc-400"; // Lägg till lite stil
  filterContainerPlaceholder.textContent = 'Laddar filter...';
  topRow.appendChild(filterContainerPlaceholder); // Lägg till placeholder på sidan

  // Hämta genrerna och, när de är klara, skapa och visa filter-komponenten
  let allGenres: Genre[] = []; // This was already declared in dev but not initialized. Now it is.
  getGenres()
    .then(genres => {
      allGenres = genres; // Spara genrerna i din allGenres-variabel
      const filterUI = createFilterComponent(allGenres); // Skapa filter-UI med de hämtade genrerna
      filterContainerPlaceholder.replaceWith(filterUI); // Ersätt placeholder med det riktiga filter-UI:et
      // After filter component is added, we should trigger a re-render to apply any default filters.
      // Assuming store.triggerRender() or similar is watched by the main app loop.
      // For now, let's just build the list based on potentially pre-set filters.
      buildFullListForCurrentView();
    })
    .catch(error => {
      console.error("Kunde inte ladda genrer:", error);
      filterContainerPlaceholder.textContent = 'Kunde inte ladda filter.'; // Visa felmeddelande om det misslyckas
    });
  // --- End Filter Component Re-integration ---

  // Grid - from dev
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
  gridWrap.appendChild(grid);

  // Pager - from dev
  const pager = document.createElement("div");
  pager.className = "mt-6 flex items-center justify-between";
  pager.innerHTML = `
    <button id="prevBtn" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10">
      ← Prev
    </button>
    <button id="nextBtn" class="rounded-xl bg-red-500/75 px-4 py-2 text-xs font-semibold text-black transition hover:bg-red-500/55">
      Next →
    </button>
  `;
  inner.appendChild(pager);

  const prevBtn = pager.querySelector<HTMLButtonElement>("#prevBtn")!;
  const nextBtn = pager.querySelector<HTMLButtonElement>("#nextBtn")!;

  let activeChip: "popular" | "recommendations" | "favorites" = "popular";
  let perPage = Number(pageSizeSelect.value);
  let page = 1;

  let fullList: TMDBMovie[] = [];
  let savedMovies: DatabaseMovie[] = [];
  let isLoading = false;
  // allGenres is declared above with the filter integration.

  const findDbMovieByTmdbId = (tmdbId: number) =>
    savedMovies.find((m) => m.tmdb_id === tmdbId);

  const setHeading = (text: string) => {
    heading.innerHTML = `
      <span class="h-6 w-1 rounded bg-red-500/75"></span>
      <span>${text}</span>
    `;
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const updatePagerUI = () => {
    const total = fullList.length; // Uses filtered list length
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
  const applyFilters = (movies: TMDBMovie[]): TMDBMovie[] => {
    const { genres, rating } = store.activeFilters;
    let filtered = movies;

    // Apply rating filter
    if (rating.over7) {
      filtered = filtered.filter(movie => movie.vote_average >= 7);
    }

    // Apply genre filter
    if (genres.length > 0) {
      // Filter for movies that have AT LEAST ONE of the selected genres.
      // If `store.activeFilters.genres` contains IDs [28, 12] (Action, Adventure),
      // a movie with genre_ids [28, 80] (Action, Crime) would match.
      filtered = filtered.filter(movie =>
        genres.some(genreId => (movie.genre_ids || []).includes(genreId)) // Assuming movie.genre_ids exists
      );
    }
    return filtered;
  };


  const render = () => {
    grid.innerHTML = "";

    if (isLoading) {
      renderSkeleton(Math.min(perPage, 20));
      updatePagerUI();
      return;
    }

    if (fullList.length === 0) { // fullList is now already filtered
      // Visa olika meddelanden beroende på vilken vy som är aktiv
      let emptyMessage = "Inget att visa här ännu.";

      if (activeChip === "recommendations") {
        emptyMessage = "Inga rekommendationer ännu. Lägg till filmer i din Watchlist eller markera filmer som Watched för att få personliga rekommendationer!";
      } else if (store.isSearching && store.searchResults.length === 0) {
        emptyMessage = `Inga resultat för "${store.currentSearchQuery}".`;
      } else if (store.activeFilters.genres.length > 0 || store.activeFilters.rating.over7) {
        emptyMessage = "Inga filmer matchade dina filterkriterier.";
      }


      grid.innerHTML = `
        <div class="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
          ${emptyMessage}
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
        b.classList.add("bg-red-500/75", "text-zinc-800", "border-red-400/75");
        b.classList.remove("bg-white/5", "text-white/80");
      } else {
        b.classList.remove("bg-red-500/75", "text-zinc-800", "border-red-400/75");
        b.classList.add("bg-white/5", "text-white/80");
      }
    }); 
  };

  const buildFullListForCurrentView = async () => {
    page = 1;
    setChipActiveStyles();

    let baseList: TMDBMovie[] = [];

    if (store.isSearching) {
      setHeading(`Resultat för "${store.currentSearchQuery}"`);
      baseList = store.searchResults;
      setChipActiveStyles();
      fullList = applyFilters(baseList); // Apply filters here
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
        fullList = applyFilters(store.popularMovies);
      } finally {
        isLoading = false;
        render();
      }
      return;
    }

    if (activeChip === "favorites") {
      setHeading("Mina favoriter");
      isLoading = false;
      baseList = getFavorites();
      
      setChipActiveStyles();
      fullList = applyFilters(baseList); // Apply filters here
      render();
      return;
    }

    if (activeChip === "recommendations") {
      setHeading("⭐ Rekommenderat för dig");

      try {
        if (store.recommendations.length === 0) {
          await loadRecommendations();
        }

        if (store.recommendations.length > 0) {
          baseList = store.recommendations;
        } else {
          baseList = [];
        }
      } catch (error) {
        console.error("Kunde inte ladda rekommendationer:", error);
        baseList = [];
      }

      setChipActiveStyles();
      fullList = applyFilters(baseList); // Apply filters here
      render();
      return;
    }
  };

  // --- Start Filter update trigger ---
  // Listen for the custom event dispatched by filter.ts
  document.addEventListener('filterchange', () => {
    buildFullListForCurrentView();
    scrollToTop();
  });
  // --- End Filter update trigger ---

  // Listen to store updates (search etc)
  setRenderCallback(buildFullListForCurrentView);

  // Load DB movies
  getMovies()
    .then((dbMovies) => {
      savedMovies = dbMovies;
      buildFullListForCurrentView(); // Initial build after DB movies loaded
    })
    .catch(() => buildFullListForCurrentView()); // Fallback if DB movies fail

  // Initial call, ensure it's made after genres are loaded
  // buildFullListForCurrentView(); // Moved into getGenres.then() and getMovies.then()

  // event listeners from dev
  chips.addEventListener("click", async(e) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    const chip = btn.dataset.chip as typeof activeChip | undefined;
    if (!chip) return;
    activeChip = chip;
    await buildFullListForCurrentView();
    scrollToTop();
  });

  pageSizeSelect.addEventListener("change", () => {
    perPage = Number(pageSizeSelect.value);
    localStorage.setItem("filmkollen_perPage", String(perPage));
    buildFullListForCurrentView();
    scrollToTop();
  });

  sortSelect.addEventListener("change", () => {
    page = 1;
    render();
  });

  prevBtn.addEventListener("click", () => {
    if (prevBtn.disabled) return;
    page -= 1;
    render();
    scrollToTop();
  });

  nextBtn.addEventListener("click", async () => {
    if (nextBtn.disabled) return;
    const nextPage = page + 1;

    // hämta flera sidor om det behövs tills nästa
    if (!store.isSearching && activeChip === "popular") {
      isLoading = true;
      render();
      await ensurePopularCount(nextPage * perPage);
      fullList = store.popularMovies;
      isLoading = false;
      // After ensuring count, re-build and filter the list
      await buildFullListForCurrentView();
    }

    page = nextPage;
    render();
    scrollToTop();
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
      if (!isLoggedIn) {
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
    if (!isLoggedIn) {
      showToast("Du måste logga in först.", false);
      window.history.pushState({}, "", "/login");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }

    const existingDbMovie = findDbMovieByTmdbId(tmdbMovie.id);
    if (existingDbMovie?.status === "watched") {
      showToast("Redan Watched");
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

  function createMovieCard(movie: TMDBMovie, dbMovie?: DatabaseMovie): HTMLElement {
    const card = document.createElement("article");
    card.className =
      "group overflow-hidden rounded-2xl bg-zinc-900/60 ring-1 ring-white/10 transition hover:ring-white/20";

    const imageUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://placehold.co/500x750?text=No+Image";

   const fav = isFavorite(movie.id);

    const isSaved = !!dbMovie;
    const isWatchlist = dbMovie?.status === "watchlist";
    const isWatched = dbMovie?.status === "watched";

    const watchlistDisabled = isSaved;
    const watchedDisabled = isWatched;

    const watchedLabel = isWatchlist ? "Mark as watched" : isWatched ? "watched" : "✓ Watched";

    const rating = Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : "0.0";
    const release = movie.release_date ?? "";

    card.innerHTML = `
    <div class="relative aspect-[2/3]">
      <img src="${imageUrl}" alt="${movie.title}" loading="lazy"
        class="h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-[1.03]" />
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent transition duration-500 group-hover:scale-[1.03]"></div>

      <div class="absolute left-3 top-3 flex items-center gap-2">
        <span class="inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] text-white/80 ring-1 ring-white/10">
          ${Icons.starSolid({ className: "h-3.5 w-3.5 text-amber-400" })}
          ${rating}
        </span>
      </div>
    </div>

    <div class="p-3 space-y-3">
      <div>
        <h3 class="text-sm font-semibold text-white/80 line-clamp-2">${movie.title}</h3>
        <p class="mt-1 text-xs text-white/55">${release}</p>
      </div>

      <div class="grid place-content-center gap-2">
        <div class="flex items-center content-center gap-2">
          <button
            data-id="${movie.id}"
            data-action="watchlist"
            ${watchlistDisabled ? "disabled" : ""}
            class="flex items-center content-center rounded-lg px-4 py-2 text-[11px] font-semibold transition truncate h-8.5
              ${watchlistDisabled ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-emerald-400/90 text-black hover:bg-emerald-400/70"}">
            <span class="inline-flex items-center justify-center gap-2">
              ${Icons.bookmark({ className: "h-3 w-3 object-cover" })}
              Watchlist
            </span>
          </button>

          <button
            data-id="${movie.id}"
            data-action="watched"
            ${watchedDisabled ? "disabled" : ""}
            class="flex items-center content-center rounded-lg px-6 py-4 text-[11px] font-semibold transition truncate h-8.5 margin-right
              ${watchedDisabled ? "bg-white/10 text-white/50 cursor-not-allowed" : "bg-red-500/75 text-black hover:bg-red-500/55"}">
              ${watchedLabel}
          </button>
        </div>

        <button
          data-id="${movie.id}"
          data-action="favorite"
          class="rounded-lg border border-white/10 bg-white/5 px-12 py-2 text-[11px] font-semibold text-white/80 hover:bg-white/10">
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
   `;

    const img = card.querySelector("img")!;
    img.addEventListener("load", () => img.classList.remove("opacity-0"));

    // --- NEW LOCAL LOGIC START ---
    const watchlistBtn = card.querySelector('button[data-action="watchlist"]') as HTMLButtonElement;
    const watchedBtn = card.querySelector('button[data-action="watched"]') as HTMLButtonElement;
    const favoriteBtn = card.querySelector('button[data-action="favorite"]') as HTMLButtonElement;

    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation(); //Prevents bubbling to container


      toggleFavorite(movie);
      heartBurstAt(favoriteBtn);

      const nowFav = isFavorite(movie.id);

      // Sync to database so the recommendation algorithm gets the +5 weight bonus
      // Pass the movie so it can be created in DB if it doesn't exist yet
      syncFavoriteToDatabase(dbMovie, nowFav, movie).then((newDbMovie) => {
        // If a new movie was created, add it to savedMovies
        if (newDbMovie) {
          savedMovies.push(newDbMovie);
          dbMovie = newDbMovie; // Update local reference
        }
      });

      // If we're on the favorites tab and just UN-favorited, remove the card
      if (activeChip === "favorites" && !nowFav) {
        card.style.transition = "opacity 0.3s, transform 0.3s";
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";
        setTimeout(() => {
          card.remove();
          // Update fullList to reflect the removal
          fullList = fullList.filter((m) => m.id !== movie.id);
          updatePagerUI();
          // Show empty message if no favorites left
          if (fullList.length === 0) {
            grid.innerHTML = `
              <div class="col-span-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
                Inga favoriter än. Lägg till filmer genom att klicka på hjärtat!
              </div>`;
          }
        }, 300);
        showToast("Borttagen från favoriter");
        return;
      }

      showToast(nowFav ? "Tillagd i favoriter ❤️" : "Borttagen från favoriter");

      //Update just this buttons UI
      const iconSpan = favoriteBtn.querySelector("span");
      if (iconSpan) {
        iconSpan.innerHTML = `
        ${nowFav
          ? Icons.heartSolid({ className: "h-4 w-4 text-rose-500"})
          : Icons.heart({ className: "h-4 w-4 text-rose-400"})
        }
        ${nowFav ? "Ta bort favorit" : "Lägg i favoriter"}
        `;
      }
    });

    const handleAction = async (btn: HTMLButtonElement, action: "watchlist" | "watched") => {
      // Check local dbMovie state directly
      if (dbMovie?.status === "watched") {
        showToast("Filmen är redan Watched");
        return;
      }

      const originalText = btn.textContent ?? "";
      btn.textContent = "Sparar...";
      btn.disabled = true;

      try {
        const updated = await upsertMovieStatusByTmdbId({
          tmdbMovie: movie,
          status: action,
          existingDbMovie: dbMovie,
        });

        // Update global list
        const idx = savedMovies.findIndex((m) => m.tmdb_id === updated.tmdb_id);
        if (idx >= 0) savedMovies[idx] = updated;
        else savedMovies.push(updated);

        showToast(action === "watchlist" ? "Sparad i Watchlist ✔" : "Markerad som Watched ✔");

        // Update UI locally without full re-render
        if (action === "watchlist") {
          btn.textContent = "Saved";
          btn.classList.add("bg-white/10", "text-white/50", "cursor-not-allowed");
          btn.classList.remove("bg-emerald-400/90", "text-black", "hover:bg-emerald-400/70");
          // Update local scope
          dbMovie = updated;
        } else { // watched
          btn.textContent = "Watched";
          btn.classList.add("bg-white/10", "text-white/50", "cursor-not-allowed");
          btn.classList.remove("bg--500/75", "text-black", "hover:bg-red-500/55");

          watchlistBtn.disabled = true;
          watchlistBtn.classList.add("bg-white/10", "text-white/50", "cursor-not-allowed");
          watchlistBtn.textContent = "Saved";
          // Update local scope
          dbMovie = updated;
        }

      } catch (err) {
        console.error(err);
        btn.disabled = false;
        btn.textContent = originalText;
        showToast("Något gick fel", false);
      }
    };

    watchlistBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleAction(watchlistBtn, "watchlist");
    });

    watchedBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleAction(watchedBtn, "watched");
    });
    // --- NEW LOCAL LOGIC END ---

    card.addEventListener("click", (e) => {
      if((e.target as HTMLElement).closest("button")) return;
      // Convert DatabaseMovie to TMDBMovie structure for the modal
      const tmdbFormat = {
        id: movie.id,
        title: movie.title,
        overview: movie.overview || "",
        poster_path: movie.poster_path || "",
        release_date: movie.release_date || "",
        vote_average: movie.vote_average || 0,
        genre_ids: movie.genre_ids || [],
      };

      const { modal, openModal } = createMovieModal(tmdbFormat, dbMovie, (updatedMovie: DatabaseMovie) => {
        const idx = savedMovies.findIndex((m) => m.id === updatedMovie.id)
        if (idx >= 0) {
          savedMovies[idx] = updatedMovie;
        } else {
          savedMovies.push(updatedMovie)
        }
        buildFullListForCurrentView(); // Re-render after modal update
      });

      document.body.appendChild(modal);
      openModal();
    });

    return card;
  }
}

function showToast(message: string, success = true) {
  const toast = document.createElement("div");
  toast.className = `
    fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm z-50
    ring-1 ring-white/10
    ${success ? "bg-emerald-500/90 text-black" : "bg-rose-500 text-white/80"}
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
