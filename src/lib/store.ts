import type { TMDBMovie } from "../types/movie";
import { getPopularMoviesTMDB, searchMoviesTMDB } from "../services/tmdbApi.ts";

class Store {
  renderCallback: () => void;

  // TMDB API state
  popularMovies: TMDBMovie[] = []; 
  searchResults: TMDBMovie[] = []; // Här hamnar filmerna vi sökt fram
  isSearching: boolean = false;    // Är vi i "sökläge" just nu
  currentSearchQuery: string = ""; // Vad vi sökte på

  constructor() {
    this.renderCallback = () => {};
  }

  // Här är vår nya sökfunktion
  async searchMovies(query: string) {
    this.currentSearchQuery = query;

    // Om vi suddar ut texten i rutan, gå tillbaka till startsidan
    if (!query.trim()) {
      this.isSearching = false;
      this.searchResults = [];
      this.triggerRender();
      return;
    }

    this.isSearching = true; // Nu tänder vi lampan: vi söker!
    try {
      // HÄR VAR FELET: Vi lägger filmerna i searchResults (lådan), inte isSearching (lampan)
      this.searchResults = await searchMoviesTMDB(query); 
      this.triggerRender();
    }
    catch (error) {
      console.error("Det gick inte att söka;", error);
      this.searchResults = []; // om det blir fel töm listan
      this.triggerRender();
    }
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
} // <--- Här stänger vi huset (klassen) nu!

const store = new Store();

export { store };

export const loadPopularMovies = store.loadPopularMovies.bind(store);  // Async
export const setRenderCallback = store.setRenderCallback.bind(store);
export const searchMovies = store.searchMovies.bind(store);
