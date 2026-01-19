import type { TMDBMovie } from '../types/movie';
//import { store, loadPopularMovies } from "../lib/store";

export default function createMovieModal(movie: TMDBMovie) {

  const modal: HTMLDivElement = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 hidden';

  modal.innerHTML = `
    <div id="modal-backdrop" class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
      <button id="modal-close-btn" class="absolute top-3 right-3 text-gray-600 hover:text-black text-2xl cursor-pointer">&times;</button>
      <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" class="w-full h-64 object-cover rounded-md mb-4">
      <h3 class="text-2xl font-bold mb-2">${movie.title}</h3>
      <div class="flex justify-between items-center mb-4">
        <span class="text-sm text-gray-500">${movie.release_date}</span>
        <span class="text-sm font-bold text-yellow-500">⭐ ${movie.vote_average.toFixed(1)}</span>
      </div>
      <p class="text-sm text-gray-700 mb-4 h-24 overflow-y-auto">${movie.overview || 'Beskrivning saknas'}</p>
      <div class="actions flex gap-2 mt-4">
        <button class="add-btn flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 transition" data-id="${movie.id}">+ Watchlist</button>
        <button class="watched-btn flex-1 bg-blue-600 text-white text-xs py-2 rounded hover:bg-blue-700 transition" data-id="${movie.id}">✓ Sedd</button>
      </div>
    </div>`;
  
  const closeModal: Function = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    modal.remove();
  }

  const openModal: Function = () => {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  const closeBtn = modal.querySelector('#modal-close-btn');
  closeBtn?.addEventListener("click", () => {
    closeModal();
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  return { modal, openModal, closeModal };
}