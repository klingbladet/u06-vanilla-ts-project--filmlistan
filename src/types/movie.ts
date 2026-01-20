export type MovieStatus = "watchlist" | "watched";

export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string;
  voteAverage: number;
  genres?: Genre[];
}

export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    release_date: string;
    vote_average: number;
    genre_ids: number[];
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
    genres?: string; // Lagras som en kommaseparerad sträng av genre-namn
  }

  export interface CreateMovieBody {
    tmdb_id: number;
    title: string;
    poster_path: string;
    release_date: string;
    overview?: string;
    
    status: MovieStatus;
    vote_average: number;
    personal_rating?: number | null
    review?: string | null;
    is_favorite?: boolean;
    date_watched?: string | null;
  }

  // En "weighted movie" är en film MED en poängsumma
  // extends betyder att WeightedMovie ärver alla fält från DatabaseMovie
  export interface WeightedMovie extends DatabaseMovie {
    weight: number;  // Poängen vi räknat ut baserat på användarens preferenser
  }

  // För kombinerade rekommendationer från flera filmer
  // Filmer som dyker upp från flera källor får högre score
  export interface ScoredRecommendation extends TMDBMovie {
    score: number;        // Hur många gånger filmen rekommenderats
    sources: string[];    // Vilka filmer som ledde till denna rekommendation
  }