import { login, isLoggedIn } from "../../lib/auth";

export default function loginView(): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen bg-zinc-950 text-white/80";

  const inner = document.createElement("div");
  inner.className = "max-w-3xl mx-auto px-4 py-10";
  container.appendChild(inner);

  inner.innerHTML = `
    <div class="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
      <h1 class="text-2xl md:text-3xl font-bold tracking-tight">
        Logga in
      </h1>

      <p class="mt-2 text-sm text-white/70">
        Demo-konto: <span class="font-semibold text-white/80">demo@filmkollen.se</span> /
        <span class="font-semibold text-white/80">film123</span>
      </p>

      <div id="msg" class="mt-4 hidden rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"></div>

      <form id="form" class="mt-6 grid gap-3">
        <label class="grid gap-1 text-sm text-white/80">
          E-post
          <input
            id="email"
            type="email"
            placeholder="demo@filmkollen.se"
            class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white/80 outline-none focus:ring-1 focus:ring-red-500/20"
          />
        </label>

        <label class="grid gap-1 text-sm text-white/80">
          Lösenord
          <input
            id="password"
            type="password"
            placeholder="film123"
            class="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-white/80 outline-none focus:ring-1 focus:ring-red-500/20"
          />
        </label>

        <button
          type="submit"
          class="mt-2 rounded-xl bg-red-500/75 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-red-500/55"
        >
          Logga in
        </button>
      </form>
    </div>
  `;

  const form = inner.querySelector<HTMLFormElement>("#form")!;
  const msg = inner.querySelector<HTMLDivElement>("#msg")!;
  const email = inner.querySelector<HTMLInputElement>("#email")!;
  const password = inner.querySelector<HTMLInputElement>("#password")!;

  // Om redan inloggad -> tillbaka hem
  if (isLoggedIn()) {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const res = login(email.value, password.value);
    if (!res.ok) {
      msg.textContent = res.message;
      msg.classList.remove("hidden");
      return;
    }

    // Gå till home efter login
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  return container;
}
