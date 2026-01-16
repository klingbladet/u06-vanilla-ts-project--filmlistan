import type { TMDBMovie } from '../types/movie';
import { reviewComponent, ratingComponent } from './review-rating';

export default function createMovieModal(movie: TMDBMovie) {

  const modal: HTMLDivElement = document.createElement('div');
  
  // 1. Sätt bas-klasser
  modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 hidden transition-opacity duration-300';

  // 2. Skapa strukturen med innerHTML först (inklusive platshållare för rating/review)
  modal.innerHTML = `
    <div id="modal-content" class="bg-zinc-900 border border-white/10 p-0 rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Close Button -->
      <button id="modal-close-btn" class="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white/80 hover:text-white hover:bg-rose-500 transition cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <!-- Image Header -->
      <div class="relative h-64 shrink-0">
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
        <div class="absolute bottom-4 left-6 right-6">
          <h3 class="text-2xl font-extrabold text-white leading-tight drop-shadow-md">${movie.title}</h3>
          <div class="flex items-center gap-3 mt-2 text-sm text-zinc-300">
             <span>${movie.release_date?.split('-')[0] || 'Unknown'}</span>
             <span class="flex items-center gap-1 text-amber-400 font-bold">⭐ ${movie.vote_average.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="p-6 overflow-y-auto custom-scrollbar">
        <p class="text-zinc-300 text-sm leading-relaxed mb-6">
          ${movie.overview || 'Ingen beskrivning tillgänglig.'}
        </p>

        <!-- Dynamic Components Slots -->
        <div class="space-y-6 border-t border-white/10 pt-6">
           <div>
             <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Ditt betyg</h4>
             <div class="rating-slot flex justify-center p-4 bg-white/5 rounded-xl"></div>
           </div>

           <div>
             <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Din recension</h4>
             <div class="review-slot"></div>
           </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-4 bg-black/20 border-t border-white/5 flex gap-3">
        <button class="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-3 text-sm font-bold hover:bg-emerald-500 hover:text-black transition">
          + Watchlist
        </button>
        <button class="flex-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 py-3 text-sm font-bold hover:bg-amber-500 hover:text-black transition">
          ✓ Markera som sedd
        </button>
      </div>

    </div>`;

  // 3. Nu när HTML finns, hämta platshållarna och stoppa in komponenterna
  
  // Rating
  const ratingSlot = modal.querySelector('.rating-slot');
  if (ratingSlot) {
    const ratingWidget = ratingComponent();
    // Styling fix för att passa modalen bättre
    ratingWidget.style.color = 'white'; 
    ratingSlot.appendChild(ratingWidget);
  }

  // Review
  const reviewSlot = modal.querySelector('.review-slot');
  if (reviewSlot) {
    const reviewWidget = reviewComponent();
    
    // Styla om input-fältet så det passar mörka temat (eftersom komponenten skapar det manuellt)

    const nameInput = reviewWidget.querySelector('input');
    if(nameInput) {
    nameInput.className = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-zinc-500";
    }

    const textArea = reviewWidget.querySelector('textarea');
    if (textArea) {
      textArea.className = "w-full h-30 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-400 placeholder-zinc-500";
      textArea.style.flex = "1";
      textArea.style.marginRight = "10px";
    }

    const btn = reviewWidget.querySelector('button');
    if (btn) {
      btn.className = "w-10 h-7 px-4 py-2 bg-zinc-700 hover:bg-gray-500 hover:text-black text-white text-sm font-bold rounded-lg transition";
      // Ta bort inline styles från komponenten som stör

      btn.style.backgroundColor = ""; 
    }

    reviewWidget.addEventListener('submit', (e) => {
      e.preventDefault();
      alert("Recension sparad! (Detta är en demo)");
    });
  
    reviewSlot.appendChild(reviewWidget);
  }
  
  // 4. Modal Logic (Open/Close)
  const closeModal = () => {
    modal.classList.add('hidden');
    // Återställ scroll på body
    document.body.style.overflow = '';
    // Ta bort modalen från DOM efter animation (300ms)
    setTimeout(() => modal.remove(), 300);
  }

  const openModal = () => {
    // Lägg till i DOM först om den inte finns (hanteras av anroparen, men vi tar bort hidden)
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  const closeBtn = modal.querySelector('#modal-close-btn');
  closeBtn?.addEventListener("click", closeModal);

  // Stäng om man klickar utanför (backdrop)
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  return { modal, openModal, closeModal };
}
