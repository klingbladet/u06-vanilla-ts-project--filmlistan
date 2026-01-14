
import { deleteMovie } from '../services/movieApi';

export function deleteButtonComponent(movieId: number, onDelete: () => void): HTMLButtonElement {
  const deleteBtn = document.createElement('button') as HTMLButtonElement;
  deleteBtn.classList.add('btn-delete', 
    'absolute', 'top-2', 'right-2', 'text-x0.5', 'font-bold', 'text-white', 'hover:text-white-700', 'p-1', 'rounded-full', 'bg-black', 'bg-opacity-75', 'hover:bg-opacity-100', 'transition-all', 'duration-200', 'w-6', 'h-6', 'flex', 'items-center', 'justify-center', 'cursor-pointer');
  deleteBtn.textContent = "X";

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation(); // Förhindra att klicket bubblar upp till andra element
    if(!confirm("Are you sure you want to remove this movie from your watched list?")) return;

    try {
      deleteBtn.textContent = "...";
      deleteBtn.disabled = true;
      await deleteMovie(movieId);
      onDelete(); // Anropa callbacken för att meddela att raderingen är klar
    }
    catch (error) {
      console.error ("Failed to delete movie:", error);
      deleteBtn.textContent = "X"; // Återställ knappens text vid fel
      deleteBtn.disabled = false;
    }
  });

  return deleteBtn;
}