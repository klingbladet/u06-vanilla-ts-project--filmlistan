// src/components/filter.ts
import type { Genre } from '../types/movie';
import { toggleRatingFilter, toggleGenreFilter } from '../lib/store';

export function createFilterComponent(genres: Genre[]): HTMLElement {
  // 1. Skapa en container för alla filter
  const filterContainer = document.createElement('div');
  filterContainer.className = 'flex gap-4 mt-3 justify-center text-sm';

  // 2. Skapa checkbox och label för betyg
  const ratingCheckbox = document.createElement("input");
  ratingCheckbox.type = "checkbox";
  ratingCheckbox.id = "ratingFilter";

  ratingCheckbox.addEventListener("change", () => {
    toggleRatingFilter(ratingCheckbox.checked);
  })

  const ratingLabel = document.createElement("label");
  ratingLabel.htmlFor = "ratingFilter";
  ratingLabel.textContent = "Betyg ≥ 7";

  // 3. Lägg till dem i containern
  filterContainer.appendChild(ratingCheckbox);
  filterContainer.appendChild(ratingLabel);

  // TODO: Här ska vi senare loopa igenom 'genres' och skapa fler checkboxar.
  genres.forEach(genre => {
    const genreCheckBox = document.createElement("input");
    genreCheckBox.type = "checkbox";
    genreCheckBox.id = `genre-${genre.id}`;

    genreCheckBox.addEventListener("change", () => {
      toggleGenreFilter(genre.id);
    })
    const genreLabel = document.createElement("label");
    genreLabel.htmlFor = `genre-${genre.id}`;
    genreLabel.textContent = genre.name;

    filterContainer.appendChild(genreCheckBox);
    filterContainer.appendChild(genreLabel);
  })

  // Sist, returnera den färdiga containern
  return filterContainer;
}