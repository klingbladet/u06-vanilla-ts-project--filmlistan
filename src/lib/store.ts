import type { TMDBMovie, DatabaseMovie, WeightedMovie, ScoredRecommendation } from "../types/movie";
import { getPopularMoviesTMDB, searchMoviesTMDB, getRecommendationsTMDB, getSimilarMoviesTMDB } from "../services/tmdbApi.ts";
import { getMovies } from "../services/movieApi.ts";

//Vi räknar hur många dagar sen en film har lagts till för att ge fördel till nyligen sedda filmer
function getDaysSince(dateString: string): number {
  const then = new Date(dateString);// Gör om text till datum-objekt
  const now = new Date();//Dagens datum
  const diffTime = now.getTime() - then.getTime();//Skillnad i millisekunder
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));//Omvandla till dagar

  return diffDays;
}
//Beräkna hur "viktig" den är för användaren. En högre poäng bör påverka rekommendation för att visa mer som denna
function calculateMovieWeight(movie: DatabaseMovie): number {
  let weight = 1;// Alla filmer börjar med 1 poäng
  //Favoriter är extra viktiga +5 poäng
  if (movie.is_favorite === 1) {
    weight += 5;
  }
  //Om användaren har gett ett personligt betyg, lägg till det i personal_rating, kan va null så vi kollar först
  if (movie.personal_rating !== null && movie.personal_rating !== undefined) { //!== null kollar att värdet inte är null (TypeScript kräver detta för säkerhet)
    weight += movie.personal_rating;// +1 till +5 poäng
  }
  //Sedda filmer är viktigare än watchlist
  if (movie.status === 'watched') {
    weight += 2; 
  }
  //Bonus för filmer sedda de senaste 30 dagar(nyligen sedda filmer reflekterar aktuell smak)
  if (movie.date_watched) {
    const daysSince = getDaysSince(movie.date_watched);
    if (daysSince < 30) {
      weight += 3; //Mer relevant om filmen har kollats på senaste 30 dagarna.
    } else if (daysSince < 90) {
      weight += 1; //Fortfarande ganska nytt
    }
  }
  return weight;
}

//Här väljer vi filmerna baserat på "weight"  där högre vikt ger större chans väljas
function selectTopWeightedMovies(movies: DatabaseMovie[], count: number): WeightedMovie[] {
  //Här beräknar vi vikt för varje film
  const weightedMovies: WeightedMovie[] = movies.map(movie => ({
    ...movie, //Kopiera alla flt från orginalet
    weight: calculateMovieWeight(movie)//Lägg till weight-fältet
  }));

  //Här sorterar vi efter vikt där hög "vikt" är självklart högst upp
  weightedMovies.sort((a, b) => b.weight - a.weight);
  
  //Ta de första X-antal filmerna Math.min försäkrar att vi inte är hämtar fler än de som finns.
  return weightedMovies.slice(0, Math.min(count, weightedMovies.length));
}

//Här kombinerar vi rekommendationerna från fler källor Filmerna som dyker upp från flera av dina favoritfilmer får högre score.
function mergeAndScoreRecommendation(
  recommendationSets: { recs: TMDBMovie[]; sourceTitle: string }[],
  existingMovieIds: Set<number>
): ScoredRecommendation[] {
  //En Map för att hålla koll på alla unika filmer. Key = film-id, Value = ScoredRecommendation objekt
  const scoreMap = new Map<number, ScoredRecommendation>();
  //Gå igenom varje set av rekommendationer
  for (const { recs, sourceTitle } of recommendationSets) {
    for (const movie of recs) {
      //Hoppa över filmer användaren redan har
      if (existingMovieIds.has(movie.id)) {
        continue; // Gå vidare till nästa film
      }
      //Har vi redan sett denna film i i våra rekommendationer?
      if (scoreMap.has(movie.id)) {
        // Om det är Ja, så ökar score och lägg till i källan
        const existing = scoreMap.get(movie.id)!; //Här säger koden att den "jag vet att filmen finns"
        existing.score += 1;
        existing.sources.push(sourceTitle);
      } else {
        //Om det är nej så är det första gången vi ser filmen
        scoreMap.set(movie.id, {
          ...movie,
          score: 1,
          sources: [sourceTitle]
        });
      }
    }
  }
  //Omvandla Map till array och sortera efter score
  const results = Array.from(scoreMap.values());
  results.sort((a, b) => {
    //Primär sortering: score (högst först)
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    //Sekundär sortering: TMDB:s vote_average
    return b.vote_average - a.vote_average;
  });
  return results;
}
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
      //Steg 1: Hämta användarens filmer från databasen
      const myMovies = await getMovies();
      
      //Steg 2: Filtrera för att få filmer vi kan basera på rekommendationer på
      //Vi vill ha watched först, sedan watchlist som backup
      let sourceMovies = myMovies.filter(m => m.status === 'watched');
      if (sourceMovies.length === 0) {
        sourceMovies = myMovies.filter(m => m.status === 'watchlist');
      } 

      //Om användaren inte har några filmer alls. Avbryt!
      if (sourceMovies.length === 0) {
        this.recommendations = [];
        this.recommendedBasedOn = "";
        return;
      }

      //Steg 3: Skapa en "Set" med alla användares film-IDs, för att filtrera bort filmer som redan är där
      const existingIds = new Set(myMovies.map(m => m.tmdb_id));

      //Steg 4: Välj de 3 viktigaste filmer eller färre om det inte finns så många.
      const topMovies = selectTopWeightedMovies(sourceMovies, 3);

      //Steg 5: Hämta recommendatiioner från TMDB för varje toppfilm.
      //Promise.all kör alla anrop SAMTIDIGT(Parallellt) för snabbhet
      const recommendationsPromises = topMovies.map(async (movie) => {
        //Hämta både recommendations och similar för varje film
        const [recs, similar] = await Promise.all([
          getRecommendationsTMDB(movie.tmdb_id),
          getSimilarMoviesTMDB(movie.tmdb_id)
        ]);
        //Kombinera båda listorna 
        return {
          recs: [...recs, ...similar],
          sourceTitle: movie.title
        };
      });

      const allRecommendationSets = await Promise.all(recommendationsPromises);

      //Steg 6: Kombinera och poängsätt alla rekommendationer
      const scoredRecommendations = mergeAndScoreRecommendation(
        allRecommendationSets,
        existingIds
      );

      //Steg 7: ta de 20 bästa recommendationerna
      this.recommendations = scoredRecommendations.slice(0, 20);

      //Steg 8: SKapa en snygg text som visar vilka filmer de var baserad på
      const basedOnTitles = topMovies.map(m => m.title).join(', ');
      this.recommendedBasedOn = basedOnTitles;
      //Steg 9: Uppdatera UI
      this.triggerRender();
    } catch (error) {
      console.error("Kunde inte ladda rekommendationer", error);
      this.recommendations = [];
      this.recommendedBasedOn = ""; 
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
