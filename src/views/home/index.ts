import type { TMDBMovie } from "../../types/movie";
import { store, loadPopularMovies } from "../../lib/store";
import { SearchComponent } from "../../components/search";
import { addMovie } from "../../services/movieApi";
import createMovieModal from "../../components/Modal";

export default function home(): HTMLElement {
  const container = document.createElement("div");
  container.className = "home-view p-4 max-w-7xl mx-auto";

  // 1. Lägg till sökfältet högst upp så vi kan använda det!
  container.appendChild(SearchComponent());

  // 2. Bestäm vilken lista vi ska titta i
  let moviesToShow: TMDBMovie[] = [];
  let headingText = "";

  if (store.isSearching) {
    // Om vi söker, använd sökresultaten
    moviesToShow = store.searchResults;
    headingText = `Sökresultat för "${store.currentSearchQuery}"`;
  } else {
    // Annars, använd de populära filmerna
    moviesToShow = store.popularMovies;
    headingText = "Populära filmer";
    
    // Om listan är tom, be roboten hämta filmer från internet
    if (moviesToShow.length === 0) {
      loadPopularMovies();
    }
  }

  // 3. Skapa rubriken med rätt namn
  const heading = document.createElement("h2");
  heading.textContent = headingText;
  heading.className = "text-2xl font-bold mb-6 text-center";
  container.appendChild(heading);

  // 4. Skapa själva galleriet för filmerna
  const grid = document.createElement("div");
  grid.className = "movie-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";

  // 5. Visa ett meddelande om det är tomt
  if (moviesToShow.length === 0) {
    const message = document.createElement("p");
    message.className = "col-span-full text-center text-gray-500 py-10";
    message.textContent = store.isSearching 
      ? "Hittade tyvärr inga filmer. Prova att söka på något annat!" 
      : "Laddar populära filmer...";
    grid.appendChild(message);
  } else {
    // 6. Rita ut varje filmkort från den lista vi valde med en eventListener för modal
    moviesToShow.forEach((movie: TMDBMovie) => {
      const card = document.createElement("div");
      card.className = "movie-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer";
      //Lägger till data-id direkt till kortet
      card.dataset.id = movie.id.toString();

      const imageUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://placehold.co/500x750?text=Ingen+bild';

      const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

      card.innerHTML = `
        <img src="${imageUrl}" alt="${movie.title}" loading="lazy" class="w-full aspect-2/3 object-cover">
        <div class="movie-info p-4 flex flex-col flex-1">
            <h3 class="font-bold text-lg mb-1 line-clamp-1">${movie.title}</h3>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-500">${year}</span>
              <span class="text-sm font-bold text-yellow-500">⭐ ${movie.vote_average.toFixed(1)}</span>
            </div>
            <p class="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">${movie.overview || 'Ingen beskrivning tillgänglig.'}</p>
            <div class="actions flex gap-2 mt-auto">
              <button class="add-btn flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 transition" data-id="${movie.id}">+ Watchlist</button>
              <button class="watched-btn flex-1 bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700 transition" data-id="${movie.id}">✓ Sedd</button>
            </div>
        </div>`;
      grid.appendChild(card);

      //EventListener som öppnar en modal med mer information om en film
      card?.addEventListener("click", (event) => {

        const target = event.target as HTMLElement;
        if(target.closest('button')) {
          return;
        }

        const movieId = card.dataset.id;

        if (!movieId) {
          return;
        }

        if (movie) {
        const { modal, openModal } = createMovieModal(movie);
        document.appendChild(modal);
        openModal();
        }
      })
    });
  }
  
  container.appendChild(grid);

  // 7. Hantera klick på knapparna (Event Delegation)
  container.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button');

    // Om vi inte klickade på en knapp, gör ingenting
    if (!btn) return;

    const movieId = Number(btn.dataset.id);
    const movie = moviesToShow.find(m => m.id === movieId);

    if (!movie) return;

    // Kolla vilken knapp det var
    const isWatchlist = btn.classList.contains('add-btn');
    const isWatched = btn.classList.contains('watched-btn');

    if (isWatchlist || isWatched) {
      // Spara originaltexten ifall det blir fel
      const originalText = btn.textContent;
      btn.textContent = "Sparar...";
      btn.disabled = true;

      try {
        await addMovie({
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path || "",
          release_date: movie.release_date || "",
          vote_average: movie.vote_average,
          overview: movie.overview,
          status: isWatchlist ? 'watchlist' : 'watched'
        });

        // Ge feedback att det lyckades
        btn.textContent = isWatchlist ? "Sparad!" : "Klar!";
        btn.classList.remove(isWatchlist ? 'bg-green-600' : 'bg-blue-600');
        btn.classList.add('bg-gray-500', 'cursor-not-allowed');
        
      } catch (error) {
        console.error("Fel vid sparning:", error);
        btn.textContent = "Fel!";
        btn.classList.add('bg-red-600');
        
        // Återställ knappen efter 2 sekunder
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.classList.remove('bg-red-600');
        }, 2000);
      }
    }
  });

  return container; 
}
