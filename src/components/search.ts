import { searchMovies, store } from "../lib/store";

export function SearchComponent(): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "mt-6";

  const form = document.createElement("form");
  form.className =
    "mx-auto flex max-w-3xl items-center gap-2 rounded-2xl bg-zinc-900/70 p-2 ring-1 ring-white/10 backdrop-blur";

  const leftIcon = document.createElement("div");
  leftIcon.className =
    "grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/70";
  leftIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
      viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
    </svg>
  `;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Sök efter film (t.ex. Interstellar)…";
  input.value = store.currentSearchQuery;

  input.className =
    "h-10 w-full bg-transparent px-2 text-sm text-white placeholder:text-zinc-500 outline-none";

  const button = document.createElement("button");
  button.type = "submit";
  button.className =
    "h-10 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-black transition hover:bg-amber-300";
  button.textContent = "Sök";

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className =
    "h-10 rounded-xl px-3 text-xs text-zinc-400 transition hover:bg-white/5 hover:text-white";
  clearBtn.textContent = "Rensa";

  clearBtn.addEventListener("click", () => {
    input.value = "";
    searchMovies("");
    input.focus();
  });

  form.appendChild(leftIcon);
  form.appendChild(input);
  form.appendChild(button);
  form.appendChild(clearBtn);

  // Snygg focus-ring
  form.addEventListener("focusin", () => {
    form.classList.add("ring-amber-400/40");
  });
  form.addEventListener("focusout", () => {
    form.classList.remove("ring-amber-400/40");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    searchMovies(input.value.trim());
  });

  wrap.appendChild(form);

  // liten helper-text under sök (modern känsla)
  const hint = document.createElement("p");
  hint.className = "mx-auto mt-3 max-w-3xl text-xs text-zinc-500";
  hint.textContent = "Tips: tryck Enter för att söka. Rensa för att se populära filmer igen.";
  wrap.appendChild(hint);

  return wrap;
}
