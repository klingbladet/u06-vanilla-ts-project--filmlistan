export type MovieStatus = "watchlist" | "watched";

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
}

export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
  }
  
  export interface DatabaseMovie {
    id: number;
    tmdb_id: number;
    title: string;
    poster_path: string | null;
    release_date: string | null;
    vote_average: number | null;
    overview: string | null;
    status: MovieStatus;
    personal_rating?: number | null;
    review: string | null;
    is_favorite: number;
    date_added: string;
    date_watched: string | null;
  }

  export interface CreateMovieBody {
    tmdb_id: number;
    title: string;
    poster_path: string;
    release_date: string;
    overview?: string;
    status: MovieStatus;
    personal_rating?: number | null
    review?: string | null;
    is_favorite?: boolean;
    date_watched?: string | null;
    vote_average: number | null;
  }