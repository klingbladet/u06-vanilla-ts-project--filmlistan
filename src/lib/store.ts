import type { TMDBMovie } from "../types/movie";
import { getPopularMoviesTMDB, searchMoviesTMDB, getRecommendationsTMDB } from "../services/tmdbApi.ts";
import { getMovies } from "../services/movieApi.ts";
class Store {
  renderCallback: () => void;

  // TMDB API state
  popularMovies: TMDBMovie[] = []; 
  searchResults: TMDBMovie[] = []; // Här hamnar filmerna vi sökt fram
  recommendations: TMDBMovie[] = [];// Lista med rekommenderade filmer
  recommendedBasedOn: string = "";// Title på filmen vi baserar tips på
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

  async loadRecommendation() {
    try {
      // Hämta filmer från DB
      const myMovies = await getMovies();
      //Försök hitta filmer i watched först
      let sourceMovies = myMovies.filter(m => m.status === 'watched');
      //Om det inte finns filmer i watched testa watchlist
      if (sourceMovies.length === 0) {
        sourceMovies = myMovies.filter(m => m.status === 'watchlist');
      }
      if (sourceMovies.length === 0) {
        this.recommendations = [];
        return;
      }
      //Funktionen för alagoritmen väljer en film baserat på tipsen och ska variera rekommendationerna efter du laddar om sidan.
      const randomIndex = Math.floor(Math.random() * sourceMovies.length);
      const baseMovie = sourceMovies[randomIndex];

      this.recommendedBasedOn = baseMovie.title; //Spara title för UI:t
      //Hämta rekommendationer från TMDB baserat på denna films ID
      this.recommendations = await getRecommendationsTMDB(baseMovie.tmdb_id);
      //Uppdatera vyerna
      this.triggerRender();
    } catch (error) {
      console.error("Kunde inte ladda rekommendationerna:", error);
      this.recommendations = [];
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
export const loadRecommendations = store.loadRecommendation.bind(store);
