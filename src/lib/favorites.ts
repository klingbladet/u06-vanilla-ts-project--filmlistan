import type { TMDBMovie } from "../types/movie";
import { getUser } from "./auth";

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
