// Importerar typen Genre (id + name)
import type { Genre } from '../types/movie';

// Importerar funktioner som uppdaterar vårt filter-state
import { toggleRatingFilter, toggleGenreFilter } from '../lib/store';

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

  // Skapar texten "Genre"
  const genreLabel = document.createElement('label');
  genreLabel.textContent = 'Genre';

  // Kopplar labeln till selecten via id
  genreLabel.htmlFor = 'genreSelect';

  // Skapar dropdownen
  const genreSelect = document.createElement('select');

  // Ger selecten ett id så labeln kan peka på den
  genreSelect.id = 'genreSelect';

  // Styling (vit bakgrund, kant, padding)
  genreSelect.className =
    'bg-white text-black border border-gray-300 rounded px-2 py-1';

  // Default-alternativ som visas först
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Alla';

  // Lägger in "Alla" i dropdownen
  genreSelect.appendChild(defaultOption);

  // Loopar igenom alla genres från API:t
  genres.forEach((genre) => {

    // Skapar ett option-element för varje genre
    const option = document.createElement('option');

    // value används i koden (id:t)
    option.value = String(genre.id);

    // textContent är det användaren ser
    option.textContent = genre.name;

    // Lägger option i selecten
    genreSelect.appendChild(option);
  });

  // Körs när användaren väljer en genre
  genreSelect.addEventListener('change', () => {

    // Hämtar valt genre-id
    const selectedGenreId = Number(genreSelect.value);

    // Om något är valt (inte "Alla")
    if (selectedGenreId) {
      toggleGenreFilter(selectedGenreId);
    }
  });

  // Bygger ihop label + select
  genreWrapper.appendChild(genreLabel);
  genreWrapper.appendChild(genreSelect);

  // ===== BETYGSFILTER =====

  // Wrapper för checkbox + label
  const ratingWrapper = document.createElement('div');
  ratingWrapper.className = 'flex items-center gap-2';

  // Skapar checkboxen
  const ratingCheckbox = document.createElement('input');
  ratingCheckbox.type = 'checkbox';
  ratingCheckbox.id = 'ratingFilter';

  // Körs när checkboxen klickas
  ratingCheckbox.addEventListener('change', () => {

    // Skickar true/false till store
    toggleRatingFilter(ratingCheckbox.checked);
  });

  // Texten bredvid checkboxen
  const ratingLabel = document.createElement('label');
  ratingLabel.htmlFor = 'ratingFilter';
  ratingLabel.textContent = 'Betyg ≥ 7';

  // Lägger checkbox + label i sin wrapper
  ratingWrapper.appendChild(ratingCheckbox);
  ratingWrapper.appendChild(ratingLabel);

  // ===== SLUTMONTERING =====

  // Lägger in genre-filtret i huvudcontainern
  filterContainer.appendChild(genreWrapper);

  // Lägger in betygs-filtret i huvudcontainern
  filterContainer.appendChild(ratingWrapper);

  // Returnerar hela filtret så det kan mountas i DOM:en
  return filterContainer;
}
