// API-anrop till Movie API
import type { DatabaseMovie, TMDBMovie } from "../types/movie.ts";

const API_BASE_URL = "http://10.100.2.90:3000/api";

async function getHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Försök hämta token från Clerk om det finns
  // @ts-ignore - Clerk kanske inte har typer globalt tillgängliga här än
  if (window.Clerk && window.Clerk.session) {
    const token = await window.Clerk.session.getToken();
    if (token) {
      // console.log("Token found, adding to headers");
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("Clerk session exists but no token returned.");
    }
  } else {
    console.warn("No Clerk session found in window.Clerk");
  }

  return headers;
}

/**
 * Body-typen som backend accepterar (matchar server/src/routes/movies.ts)
 * jag gör den lokalt här så ni inte får fel om CreateMovieBody saknas i types/movie.ts.
 */
type CreateMovieBody = {
  tmdb_id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  overview?: string | null;
  status: "watchlist" | "watched";
  personal_rating?: number | null;
  review?: string | null;
  is_favorite?: boolean;
  date_watched?: string | null;
};

export async function getMovies(): Promise<DatabaseMovie[]> {
  const response = await fetch(`${API_BASE_URL}/movies`, { headers: await getHeaders() });

  if (!response.ok) {
    throw new Error("Kunde inte hämta filmerna");
  }

  return await response.json();
}

export async function addMovie(movie: CreateMovieBody): Promise<DatabaseMovie> {
  const response = await fetch(`${API_BASE_URL}/movies`, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    let msg = "Kunde inte spara filmen";
    try {
      const errorData = await response.json();
      // Prefer detailed message if available
      msg = errorData.message || errorData.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return await response.json();
}

export async function updateMovie(
  id: number,
  data: Partial<CreateMovieBody>
): Promise<DatabaseMovie> {
  const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: "PUT",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let msg = "Kunde inte uppdatera filmen!";
    try {
      const errorData = await response.json();
      msg = errorData.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return await response.json();
}

export async function deleteMovie(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Kunde inte ta bort filmen");
  }
}

/**
 * Skapar eller uppdaterar en film baserat på tmdb_id
 * - Finns inte filmen → POST
 * - Finns filmen → PUT (uppdatera status)
 */
export async function upsertMovieStatusByTmdbId(args: {
  tmdbMovie: TMDBMovie;
  status: "watchlist" | "watched";
  existingDbMovie?: DatabaseMovie;
}): Promise<DatabaseMovie> {
  const { tmdbMovie, status, existingDbMovie } = args;

  // Om filmen redan finns  uppdatera
  if (existingDbMovie) {
    return updateMovie(existingDbMovie.id, {
      status,
      date_watched: status === "watched" ? new Date().toISOString() : null,
    });
  }

  // Annars  skapa ny
  return addMovie({
    tmdb_id: tmdbMovie.id,
    title: tmdbMovie.title,
    poster_path: tmdbMovie.poster_path ?? null,
    release_date: tmdbMovie.release_date ?? null,
    overview: tmdbMovie.overview ?? null,
    // vote_average  valfri. Du kan spara den om du vill:
    vote_average: Number.isFinite(tmdbMovie.vote_average) ? tmdbMovie.vote_average : null,
    status,
    date_watched: status === "watched" ? new Date().toISOString() : null,
  });
}
