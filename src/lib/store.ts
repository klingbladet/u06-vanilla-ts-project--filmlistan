import type { TMDBMovie } from "../types/movie";
import { getPopularMoviesTMDB, searchMoviesTMDB } from "../services/tmdbApi.ts";

class Store {
  renderCallback: () => void = () => {};

  popularMovies: TMDBMovie[] = [];
  searchResults: TMDBMovie[] = [];
  isSearching = false;
  currentSearchQuery = "";

  popularPageLoaded = 0;
  isLoadingPopular = false;

  async searchMovies(query: string) {
    this.currentSearchQuery = query;

    if (!query.trim()) {
      this.isSearching = false;
      this.searchResults = [];
      this.triggerRender();
      return;
    }

    this.isSearching = true;
    try {
      this.searchResults = await searchMoviesTMDB(query, 1);
      this.triggerRender();
    } catch (error) {
      console.error("Det gick inte att söka:", error);
      this.searchResults = [];
      this.triggerRender();
    }
  }

  async loadPopularMovies(shouldTriggerRender: boolean = true) {
    this.isSearching = false;
    this.currentSearchQuery = "";
    this.searchResults = [];

    this.popularMovies = [];
    this.popularPageLoaded = 0;

    await this.loadPopularMoviesPage(1);

    if (shouldTriggerRender) this.triggerRender();
    return this.popularMovies;
  }

  async loadPopularMoviesPage(page: number) {
    if (this.isLoadingPopular) return;
    this.isLoadingPopular = true;

    try {
      console.log("[TMDB] loading popular page:", page); // ✅ DEBUG

      const results = await getPopularMoviesTMDB(page);

      const existingIds = new Set(this.popularMovies.map((m) => m.id));
      const merged = [...this.popularMovies];

      for (const m of results) {
        if (!existingIds.has(m.id)) merged.push(m);
      }

      this.popularMovies = merged;
      this.popularPageLoaded = Math.max(this.popularPageLoaded, page);

      console.log("[TMDB] total popular movies:", this.popularMovies.length); // ✅ DEBUG
    } catch (error) {
      console.error("Failed to load popular page:", error);
    } finally {
      this.isLoadingPopular = false;
    }
  }

  async ensurePopularCount(minCount: number) {
    if (this.isSearching) return;

    if (this.popularMovies.length === 0 && this.popularPageLoaded === 0) {
      await this.loadPopularMovies(false);
    }

    if (this.popularMovies.length >= minCount) return;

    const neededPages = Math.ceil(minCount / 20);
    const start = Math.max(1, this.popularPageLoaded + 1);

    for (let p = start; p <= neededPages; p++) {
      await this.loadPopularMoviesPage(p);
    }

    // r
  }

  setRenderCallback(cb: () => void) {
    this.renderCallback = cb;
  }

  triggerRender() {
    this.renderCallback?.();
  }
}

export const store = new Store();

export const loadPopularMovies = store.loadPopularMovies.bind(store);
export const ensurePopularCount = store.ensurePopularCount.bind(store);
export const setRenderCallback = store.setRenderCallback.bind(store);
export const searchMovies = store.searchMovies.bind(store);
