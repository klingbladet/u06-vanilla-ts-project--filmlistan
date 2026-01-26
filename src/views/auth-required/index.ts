export default function authRequired(title = "Du måste logga in"): HTMLElement {
    const container = document.createElement("div");
    container.className = "min-h-screen text-white/80";
  
    const inner = document.createElement("div");
    inner.className = "max-w-3xl mx-auto px-4 py-10";
    container.appendChild(inner);
  
    inner.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
          ${title}
        </h1>
  
        <p class="mt-2 text-sm text-white/70">
          För att se din Watchlist och Watched-lista behöver du vara inloggad.
        </p>
  
        <div class="mt-6 flex flex-wrap gap-3">
          <a href="/login" class="rounded-xl bg-red-500/75 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-red-500/55">
            Gå till Logga in
          </a>
  
          <a href="/" class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10">
            Tillbaka till Home
          </a>
        </div>
      </div>
    `;
  
    return container;
  }
  