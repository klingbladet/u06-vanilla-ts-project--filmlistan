// API-anrop till TMDB API
import type { TMDBMovie, Genre } from "../types/movie.ts";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

//  ska visa true i console
console.log("[TMDB] API KEY exists?", Boolean(TMDB_API_KEY));

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  if (!TMDB_API_KEY) {
    throw new Error(
      "VITE_TMDB_API_KEY saknas i .env (glöm inte starta om npm run dev)."
    );
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "sv-SE");

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

export async function getPopularMoviesTMDB(page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/popular", { page });
  return data.results ?? [];
}

export async function searchMoviesTMDB(query: string, page: number = 1): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/search/movie", {
    query,
    page,
    include_adult: "false",
  });
  return data.results ?? [];
}



export async function getGenres(): Promise<Genre[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
  );

  if (!response.ok) {
    throw new Error(`Något blev fel: ${response.status}`);
  }

  const data = await response.json();
  return data.genres;
}

export async function getRecommendationsTMDB(movieId: number): Promise<TMDBMovie[]> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/recommendations?api_key=${TMDB_API_KEY}&language=en-US&page=1`);
  if (!response.ok) {
    throw new Error('Kunde inte hämta rekommendationer');
  }
  const data = await response.json();
  return data.results;
}

//Här hämtar man filmer baserat på genre och keyword, detta ger fler alternativ att kombinera med rekommendationer
export async function getSimilarMoviesTMDB(movieId: number): Promise<TMDBMovie[]> {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}/similar?api_key=${TMDB_API_KEY}&language=en-US&page=1`
  );

  if (!response.ok) {
    throw new Error('Kunde inte hämta liknande filmer');
  }
  const data = await response.json();
  return data.results;
}
