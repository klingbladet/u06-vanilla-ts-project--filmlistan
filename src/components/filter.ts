// Importerar typen Genre (id + name)
import type { Genre } from '../types/movie';

// Importerar funktioner som uppdaterar vårt filter-state
import { toggleRatingFilter } from '../lib/store';
import { store } from '../lib/store'; // direkt access för dropdown-logik

// Funktion som bygger hela filter-UI:t och returnerar ett DOM-element
export function createFilterComponent(genres: Genre[]): HTMLElement {

  // Skapar en wrapper-div som håller ALLA filter
  const filterContainer = document.createElement('div');

  // Sätter layout: flex, mellanrum, centrering, textstorlek
  filterContainer.className = 'flex gap-6 mt-3 justify-center text-sm';

  // ===== GENRE-FILTER =====

  // Wrapper för label + select (för layout)
  const genreWrapper = document.createElement('div');
  genreWrapper.className = 'flex items-center gap-2';

  // Skapar "Genre" filter
  const genreLabel = document.createElement('label');
  genreLabel.textContent = 'Genre';
  genreLabel.htmlFor = 'genreSelect';

  // Skapar dropdownen
  const genreSelect = document.createElement('select');
  genreSelect.id = 'genreSelect';
  genreSelect.className = 'bg-white text-black border border-gray-300 rounded px-2 py-1';

  // Default-alternativ
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Alla';
  genreSelect.appendChild(defaultOption);

  // Lägg till alla genres
  genres.forEach((genre) => {
    const option = document.createElement('option');
    option.value = String(genre.id);
    option.textContent = genre.name;
    genreSelect.appendChild(option);
  });

  // Körs när användaren väljer en genre
  genreSelect.addEventListener('change', () => {
    const value = genreSelect.value;

    // Rensa hela genrefiltret först
    store.activeFilters.genres = [];

    // Om inte "Alla", sätt den valda genren
    if (value !== '') {
      store.activeFilters.genres.push(Number(value));
    }

    // Trigger render så listan uppdateras
    store.triggerRender();
  });

  // Bygger ihop label + select
  genreWrapper.appendChild(genreLabel);
  genreWrapper.appendChild(genreSelect);

  // ===== BETYGSFILTER ===== skapandet av checkbox/filtrering av betyg över 7 under

  const ratingWrapper = document.createElement('div');
  ratingWrapper.className = 'flex items-center gap-2';

  const ratingCheckbox = document.createElement('input');
  ratingCheckbox.type = 'checkbox';
  ratingCheckbox.id = 'ratingFilter';
  ratingCheckbox.className =
  'h-4 w-4 accent-blue-600 cursor-pointer';



  ratingCheckbox.addEventListener('change', () => {
    toggleRatingFilter(ratingCheckbox.checked);
  });

  const ratingLabel = document.createElement('label');
  ratingLabel.htmlFor = 'ratingFilter';
  ratingLabel.textContent = 'Betyg ≥ 7';
  

  ratingWrapper.appendChild(ratingCheckbox);
  ratingWrapper.appendChild(ratingLabel);

  // ===== LÄGG ALLT I CONTAINER =====
  filterContainer.appendChild(genreWrapper);
  filterContainer.appendChild(ratingWrapper);

  return filterContainer;
}
