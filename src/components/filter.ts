// src/components/filter.ts
import type { Genre } from '../types/movie';

export function createFilterComponent(genres: Genre[]): HTMLElement {
  // 1. Skapa en container för alla filter
  const filterContainer = document.createElement('div');
  filterContainer.className = 'flex gap-4 mt-3 justify-center text-sm';

  // 2. Skapa checkbox och label för betyg
  const ratingCheckbox = document.createElement("input");
  ratingCheckbox.type = "checkbox";
  ratingCheckbox.id = "ratingFilter";

  const ratingLabel = document.createElement("label");
  ratingLabel.htmlFor = "ratingFilter";
  ratingLabel.textContent = "Betyg ≥ 7";

  // 3. Lägg till dem i containern
  filterContainer.appendChild(ratingCheckbox);
  filterContainer.appendChild(ratingLabel);

  // HÄR LÄGGS KOD FÖR GENRE-FILTREN TILL
  genres.forEach(genre => {
    // 1. Skapa en checkbox för den aktuella genren
    const genreCheckbox = document.createElement("input");
    genreCheckbox.type = "checkbox";
    genreCheckbox.id = `genre-${genre.id}`; // Ge den ett unikt ID baserat på genrens ID

    // 2. Skapa en label för den aktuella genren
    const genreLabel = document.createElement("label");
    genreLabel.htmlFor = `genre-${genre.id}`;
    genreLabel.textContent = genre.name; // Visa genrens namn

    // 3. Lägg till checkboxen och labeln i din filterContainer
    filterContainer.appendChild(genreCheckbox);
    filterContainer.appendChild(genreLabel);
  });

  // Sist, returnera den färdiga containern
  return filterContainer;
}
