// API-anrop till Movie API
import type { DatabaseMovie, CreateMovieBody } from "../types/movie";

const API_BASE_URL = "http://localhost:3000/api";
const USER_ID = "Chas-n-Chill";

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  "x-user-id": USER_ID,
};

export async function getMovies(): Promise<DatabaseMovie[]> {
  const response = await fetch(`${API_BASE_URL}/movies`, { headers });
  if (!response.ok) throw new Error("Kunde inte hämta filmerna");
  return await response.json();
}

export async function addMovie(movie: CreateMovieBody): Promise<DatabaseMovie> {
  const response = await fetch(`${API_BASE_URL}/movies`, {
    method: "POST",
    headers,
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    let errorMsg = "Kunde inte spara filmen";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return await response.json();
}

export async function updateMovie(
  id: number,
  data: Partial<CreateMovieBody>
): Promise<DatabaseMovie> {
  const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMsg = "Kunde inte uppdatera filmen!";
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return await response.json();
}

export async function deleteMovie(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error("Kunde inte ta bort filmen");
}

/**
 * SMART helper:
 * - Om filmen finns i DB (matchar tmdb_id) => PUT /movies/:id (uppdatera status)
 * - Annars => POST /movies (lägg till)
 */
export async function upsertMovieStatusByTmdbId(args: {
  tmdbMovie: {
    id: number;
    title: string;
    poster_path?: string | null;
    release_date?: string | null;
    vote_average?: number | null;
    overview?: string | null;
  };
  status: "watchlist" | "watched";
  existingDbMovie?: DatabaseMovie | undefined;
}): Promise<DatabaseMovie> {
  const { tmdbMovie, status, existingDbMovie } = args;

  // Om filmen redan finns: uppdatera den
  if (existingDbMovie) {
    return await updateMovie(existingDbMovie.id, {
      status,
      // Sätt date_watched om man markerar watched
      date_watched: status === "watched" ? new Date().toISOString() : null,
    });
  }

  // Annars: skapa ny
  return await addMovie({
    tmdb_id: tmdbMovie.id,
    title: tmdbMovie.title,
    poster_path: tmdbMovie.poster_path ?? "",
    release_date: tmdbMovie.release_date ?? "",
    overview: tmdbMovie.overview ?? "",
    status,
    date_watched: status === "watched" ? new Date().toISOString() : null,
  });
  
}
