import type { TMDBMovie } from "../types/movie";
import { store } from "../lib/store";

// Hämta inputfältet från SearchComponent
const input = document.querySelector<HTMLInputElement>("input");

// Hämta container där filtrerade filmer ska visas
const movieContainer = document.getElementById("movie-list") as HTMLUListElement;

input?.addEventListener("input", () => {
  const inputValue = input.value.toLowerCase();

  // Filtrera filmer baserat på inputValue
  const findInputValue = store.popularMovies.filter((movie: TMDBMovie) =>
    movie.title.toLowerCase().includes(inputValue)
  );

  filterMovie(findInputValue);
});

function filterMovie(listanMedAllaFilmer: TMDBMovie[]) {
  if (!movieContainer) return;

  // Rensa tidigare filmer
  movieContainer.innerHTML = "";

  listanMedAllaFilmer.forEach((movie: TMDBMovie) => {
    const movieName = document.createElement("li");
    const movieImage = document.createElement("img");

    movieName.textContent = movie.title;
    movieImage.src = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "";
    movieImage.alt = movie.title;

    movieName.appendChild(movieImage);
    movieContainer.appendChild(movieName);
  });
}
