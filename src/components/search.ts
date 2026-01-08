import { searchMovies, store } from "../lib/store";

export function SearchComponent(): HTMLElement {
const form = document.createElement("form");
form.className = "flex gap-2 mb-8 justify-center max-w-lg mx-auto";

const input = document.createElement("input");
input.type = "text";
input.placeholder = "Sök"
input.className = "flex-1 p-2 border-gray-300 rounded text-black";

input.value = store.currentSearchQuery;

const button = document.createElement("button");
button.type="submit";
button.textContent = "Sök"
button.className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition";

form.appendChild(input);
form.appendChild(button);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  searchMovies(input.value);
});
return form;
}