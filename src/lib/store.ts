import type { TMDBMovie } from "../types/movie";
import { getPopularMoviesTMDB, searchMoviesTMDB } from "../services/tmdbApi.ts";

class Store {
  renderCallback: () => void;

  // TMDB API state
  popularMovies: TMDBMovie[] = []; 
  searchResults: TMDBMovie[] = [];
  isSearching: boolean = false;
  currentSearchQuery: string = "";

  // State för filter-inställningar
  activeFilters = {
    rating: false,
    genres: [] as number[]
  }

  // Getter som alltid returnerar den filtrerade listan
  get filteredMovies(): TMDBMovie[] {
    const moviesToFilter = this.isSearching ? this.searchResults : this.popularMovies;

    // Applicera betygsfilter
    let filtered = this.activeFilters.rating
      ? moviesToFilter.filter(movie => movie.vote_average >= 7)
      : moviesToFilter;

    // Applicera genrefilter
    if (this.activeFilters.genres.length > 0) {
      filtered = filtered.filter(movie => 
        Array.isArray(movie.genre_ids) && movie.genre_ids.some(id => this.activeFilters.genres.includes(id))
      );
    }

    return filtered;
  }

  constructor() {
    this.renderCallback = () => {};
  }

  // Sökfunktion
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
      this.searchResults = await searchMoviesTMDB(query); 
      this.triggerRender();
    }
    catch (error) {
      console.error("Det gick inte att söka;", error);
      this.searchResults = [];
      this.triggerRender();
    }
  }

  // Metod för att slå på/av betygsfiltret
  toggleRatingFilter(isActive: boolean) {
    this.activeFilters.rating = isActive;
    this.triggerRender();
  }

  // Metod för att slå på/av ett genrefilter
  toggleGenreFilter(genreId: number) {
    const { genres } = this.activeFilters;
    const index = genres.indexOf(genreId);

    if (index === -1) {
      genres.push(genreId);
    } else {
      genres.splice(index, 1);
    }

    this.triggerRender();
  }

  async loadPopularMovies(shouldTriggerRender: boolean = true) {
    try {
      this.popularMovies = await getPopularMoviesTMDB();
      if (shouldTriggerRender) {
        this.triggerRender();
      }
      
      return this.popularMovies;
    } catch (error) {
      console.error("Failed to load popular movies:", error);
      return [];
    }
  }

  // ========== RENDER CALLBACK ==========
  
  setRenderCallback(renderApp: () => void) {
    this.renderCallback = renderApp;
  }

  triggerRender() {
    if (this.renderCallback) {
      this.renderCallback();
    }
  }
}

const store = new Store();

export { store };

export const loadPopularMovies = store.loadPopularMovies.bind(store);
export const setRenderCallback = store.setRenderCallback.bind(store);
export const searchMovies = store.searchMovies.bind(store);
export const toggleRatingFilter = store.toggleRatingFilter.bind(store);
export const toggleGenreFilter = store.toggleGenreFilter.bind(store);