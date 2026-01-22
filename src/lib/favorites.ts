import type { TMDBMovie, DatabaseMovie } from "../types/movie";
import { getUser } from "./auth";
import { updateMovie, addMovie } from "../services/movieApi";

function key() {
  const user = getUser();
  const who = user?.email ?? "guest";
  return `filmkollen_favorites_${who}`;
}

export function getFavorites(): TMDBMovie[] {
  try {
    const raw = localStorage.getItem(key());
    return raw ? (JSON.parse(raw) as TMDBMovie[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(tmdbId: number): boolean {
  return getFavorites().some((m) => m.id === tmdbId);
}

export function toggleFavorite(movie: TMDBMovie): { added: boolean } {
  const list = getFavorites();
  const exists = list.some((m) => m.id === movie.id);

  const next = exists ? list.filter((m) => m.id !== movie.id) : [movie, ...list];
  localStorage.setItem(key(), JSON.stringify(next));

  return { added: !exists };
}

/**
 * Syncs the favorite status to the database for the recommendation algorithm.
 * - If the movie exists in DB: updates is_favorite
 * - If the movie doesn't exist AND is being favorited: creates it as "watched" with is_favorite=true
 *   (Favoriting implies the user has already seen and loved the movie)
 * This ensures the +5 weight bonus is applied for recommendations.
 */
export async function syncFavoriteToDatabase(
  dbMovie: DatabaseMovie | undefined,
  isFav: boolean,
  tmdbMovie?: TMDBMovie
): Promise<DatabaseMovie | void> {
  try {
    // Movie exists in database - just update the favorite status
    if (dbMovie) {
      await updateMovie(dbMovie.id, { is_favorite: isFav });
      return;
    }

    // Movie doesn't exist yet, but user is favoriting it
    // Create it in the database as "watched" with is_favorite=true
    // (If you're favoriting a movie, you've probably already seen it!)
    if (!dbMovie && isFav && tmdbMovie) {
      const newMovie = await addMovie({
        tmdb_id: tmdbMovie.id,
        title: tmdbMovie.title,
        poster_path: tmdbMovie.poster_path ?? null,
        release_date: tmdbMovie.release_date ?? null,
        overview: tmdbMovie.overview ?? null,
        vote_average: Number.isFinite(tmdbMovie.vote_average) ? tmdbMovie.vote_average : null,
        status: "watched", // Favoriting = already seen and loved it
        is_favorite: true,
        date_watched: new Date().toISOString(), // Set today as watch date
      });
      return newMovie;
    }

    // If un-favoriting a movie that's not in DB, nothing to do
  } catch (error) {
    console.error("Could not sync favorite to database:", error);
  }
}
