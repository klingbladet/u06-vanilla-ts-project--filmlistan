// API-anrop till TMDB API
import type { TMDBMovie } from "../types/movie.ts";

const API_KEY = '85a4b73dc7961b2d832676f9a6dab604';

const BASE_URL = 'https://api.themoviedb.org/3';
export const TMBD_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export async function getPopularMoviesTMDB(): Promise<TMDBMovie[]> {
  const response = await fetch (`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`);
  if (!response.ok) {
    throw new Error('Kunde inte hämta populära filmer');
  }
// TMBD Return array in "results" 
  const data = await response.json();
  return data.results;
}

export async function searchMoviesTMDB(query: string): Promise<TMDBMovie[]> {
  if (!query) return [];

  const response = await fetch (`${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${
    encodeURIComponent(query)}&page=1`);

    if (!response.ok) {
      throw new Error ('Kunde inte söka efter filmer');
    }
    const data = await response.json();
    return data.results;
}