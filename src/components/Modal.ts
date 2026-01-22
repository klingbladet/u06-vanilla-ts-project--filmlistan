import type { DatabaseMovie, TMDBMovie } from '../types/movie';
import { reviewComponent, ratingComponent } from './review-rating';
import { updateMovie, upsertMovieStatusByTmdbId } from '../services/movieApi';

export default function createMovieModal(movie: TMDBMovie, dbMovie?: DatabaseMovie, onUpdate?: (updatedMovie: DatabaseMovie) => void) {

  const modal: HTMLDivElement = document.createElement('div');
  
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden transition-opacity duration-300';

  modal.innerHTML = `
    <div id="modal-content" class="bg-zinc-900 border border-white/10 p-0 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col max-h-[90vh]">
      
      <button id="modal-close-btn" class="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white/80 hover:text-white/80 hover:bg-rose-600/70 transition duration-150 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div class="relative h-64 shrink-0">
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
        <div class="absolute bottom-4 left-6 right-6">
          <h3 class="text-2xl font-bold text-white/80 leading-tight drop-shadow-md">${movie.title}</h3>
          <div class="flex items-center gap-3 mt-2 text-sm text-zinc-300">
             <span>${movie.release_date?.split('-')[0] || 'Unknown'}</span>
             <span class="flex items-center gap-1 text-/80 font-semibold">⭐ ${movie.vote_average.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div class="p-6 overflow-y-auto custom-scrollbar">
        <p class="text-zinc-300 text-sm leading-relaxed mb-6">
          ${movie.overview || 'Ingen beskrivning tillgänglig.'}
        </p>

        <div class="space-y-6 border-t border-white/10 pt-6">
           <div>
             <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Ditt betyg</h4>
             <div class="rating-slot flex justify-center p-4 bg-zinc-800/40 rounded-xl"></div>
           </div>

           <div>
             <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Din recension</h4>
             <div class="review-slot"></div>
           </div>
        </div>
      </div>

      <div class="p-4 bg-black/20 border-t border-white/5 flex gap-3">
        <button id="watchlist-button" class="flex-1 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-400/90 py-3 text-sm font-bold hover:bg-emerald-400/90 hover:text-zinc-800 transition duration-150 ease-in-out">
          + Watchlist
        </button>
        <button id="watched-button" class="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500/75 py-3 text-sm font-bold hover:bg-red-500/75 hover:text-zinc-800 transition duration-150 ease-in-out">
          ✓ Markera som sedd
        </button>
      </div>

    </div>`;

  const watchlistBtn = modal.querySelector('#watchlist-button') as HTMLButtonElement;
  const watchedBtn = modal.querySelector('#watched-button') as HTMLButtonElement;

  if(dbMovie?.status === 'watchlist') {
    watchlistBtn.textContent = 'Added';
    watchlistBtn.disabled = true;
    watchlistBtn.classList.add('opacity-50', 'cursor-not-allowed');
  } else if (dbMovie?.status === 'watched') {
    watchlistBtn.style.display = 'none';
    watchedBtn.textContent = 'Watched ✅';
    watchedBtn.disabled = true;
  }

  watchlistBtn.addEventListener('click', async () => {
    try {
      watchlistBtn.textContent = 'Saving...';
      watchlistBtn.disabled = true;

      const updated = await upsertMovieStatusByTmdbId({
        tmdbMovie: movie,
        status: 'watchlist',
        existingDbMovie: dbMovie
      });

      watchlistBtn.textContent = 'Added';
      watchlistBtn.classList.add('opacity-50', 'cursor-not-allowed');

      dbMovie = updated;

      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error(err)
      watchlistBtn.textContent = '+ watchlist';
      watchlistBtn.disabled = false;
      alert("Kunde inte spara till watchlist.");
    }
  });

  watchedBtn.addEventListener('click', async () => {
    try {
      watchedBtn.textContent = 'Saving...';
      watchedBtn.disabled = true;

      const updated = await upsertMovieStatusByTmdbId({
        tmdbMovie: movie,
        status: 'watched',
        existingDbMovie: dbMovie
      });

      watchedBtn.textContent = 'Sett';
      watchedBtn.classList.add('opacity-50', 'cursor-not-allowed');

      dbMovie = updated;

      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error(err)
      watchedBtn.textContent = 'Markera som sedd';
      watchedBtn.disabled = false;
      alert("Kunde inte spara till watched.");
    }
  });


  // Inject Components without parameters
  const ratingSlot = modal.querySelector('.rating-slot');
  if (ratingSlot) {
    const ratingWidget = ratingComponent(dbMovie?.personal_rating || 0, async (newRating) => {
      if (dbMovie) {
        try {
          await updateMovie(dbMovie.id, { personal_rating: newRating });
          dbMovie.personal_rating = newRating;
          if (onUpdate) onUpdate(dbMovie);
        } catch (err) {
          console.error("Failed to update rating from modal:", err);
          alert("Kunde inte spara betyget.")
        }
      }
    });
    ratingWidget.style.color = 'white'; 
    ratingSlot.appendChild(ratingWidget);
  }

  const reviewSlot = modal.querySelector('.review-slot');
  if (reviewSlot) {
    const initialReview = dbMovie?.review || '';
    const reviewWidget = reviewComponent(initialReview, async (newReviewText) => {
      if (dbMovie) {
        try {
          await updateMovie(dbMovie.id, { review: newReviewText });
          dbMovie.review = newReviewText;

          if(onUpdate) onUpdate(dbMovie);

          alert("Recension sparad!");
        } catch (err) {
          console.error("Failed to save review", err);
          alert("Kunde inte spara recensionen.");
        }
      } else {
        alert("Du måste spara filmen (i watchlist eller watched innan du kan recensera den.)")
      }
    });
    reviewSlot.appendChild(reviewWidget);
  }
  
  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 300);
  }

  const openModal = () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  const closeBtn = modal.querySelector('#modal-close-btn');
  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  return { modal, openModal, closeModal };
}