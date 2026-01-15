import { store } from "../lib/store";
import type { TMDBMovie } from "../types/movie";

import { getGenre } from "../services/tmdbApi";

let moviesToFilter: TMDBMovie[] = store.isSearching ? store.searchResults : store.popularMovies;



  const filterRow = document.createElement("div");
  filterRow.className = "flex gap-4 mt-3 justify-center text-sm";

  // Checkbox: Betyg ≥ 7
  const ratingCheckbox = document.createElement("input");
  ratingCheckbox.type = "checkbox";
  ratingCheckbox.id = "ratingFilter";

  const ratingLabel = document.createElement("label");
  ratingLabel.htmlFor = "ratingFilter";
  ratingLabel.textContent = "Betyg ≥ 7";

  // Checkbox: Action
  const actionCheckbox = document.createElement("input");
  actionCheckbox.type = "checkbox";
  actionCheckbox.id = "actionFilter";

  const actionLabel = document.createElement("label");
  actionLabel.htmlFor = "actionFilter";
  actionLabel.textContent = "Action";

  // Lägg till i raden
  filterRow.appendChild(ratingCheckbox);
  filterRow.appendChild(ratingLabel);
  filterRow.appendChild(actionCheckbox);
  filterRow.appendChild(actionLabel);


 moviesToFilter.filter(movie => {
  let pass = true;

  // Exempel: Betyg ≥ 7
  if (ratingCheckbox.checked) {
    pass = pass && movie.vote_average >= 7;
  }

  // Exempel: Genre Action (om TMDBMovie hade genre info)
  if (actionCheckbox.checked) {
    pass = pass && movie.genre_ids?.includes(28); // 28 = Action i TMDB
  }

  return pass;
});

