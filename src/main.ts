import "./style.css";
import { setRenderCallback } from "./lib/store.ts";
import { isLoggedIn, logout, getUser } from "./lib/auth";

import headerHTML from "./views/static/header/index.html?raw";
import footerHTML from "./views/static/footer/index.html?raw";


// Dynamiska sidor
import home from "./views/home/index.ts";
import watchlist from "./views/watchlist/index.ts";
import watched from "./views/watched/index.ts";
import loginView from "./views/login/index.ts";
import authRequired from "./views/auth-required/index.ts";

const app = document.querySelector("#app")!;

const currentPage = (): string | HTMLElement => {
  const path = window.location.pathname;

  if (path === "/watchlist" && !isLoggedIn()) {
    return authRequired("Logga in för att se din Watchlist");
  }
  if (path === "/watched" && !isLoggedIn()) {
    return authRequired("Logga in för att se dina Watched-filmer");
  }

  switch (path) {
    case "/":
      return home();
    case "/watchlist":
      return watchlist();
    case "/watched":
      return watched();
    case "/login":
      return loginView();
    default:
      return "404";
  }
};

function setActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle("active", href === path);
  });
}

function syncHeaderAuthUI() {
  const loginLink = document.querySelector<HTMLAnchorElement>("#loginLink");
  const logoutBtn = document.querySelector<HTMLButtonElement>("#logoutBtn");
  if (!loginLink || !logoutBtn) return;

  if (isLoggedIn()) {
    const user = getUser();
    loginLink.textContent = user?.email ?? "Konto";
    loginLink.href = "/";
    logoutBtn.classList.remove("hidden");
  } else {
    loginLink.textContent = "Logga in";
    loginLink.href = "/login";
    logoutBtn.classList.add("hidden");
  }

  logoutBtn.onclick = () => {
    logout();
    window.history.pushState({}, "", "/");
    renderApp();
  };
}

const renderApp = () => {
  const page = currentPage();

  if (typeof page === "string") {
    app.innerHTML = `
      ${headerHTML}
      <main class="mx-auto max-w-7xl px-4 py-10 text-white">
        <h1 class="text-xl font-bold">${page}</h1>
      </main>
      ${footerHTML}
    `;
  } else {
    app.innerHTML = `${headerHTML}${footerHTML}`;
    app.insertBefore(page, app.querySelector("footer")!);
  }

  setActiveNavLink();
  syncHeaderAuthUI();
};

renderApp();

window.addEventListener("popstate", () => renderApp());

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest("a") as HTMLAnchorElement | null;
  if (!link) return;

  if (!link.href.startsWith(window.location.origin)) return;
  if (e.ctrlKey || e.metaKey || e.shiftKey || (e as MouseEvent).button === 1) return;

  e.preventDefault();
  const path = new URL(link.href).pathname;
  window.history.pushState({}, "", path);
  renderApp();
});

setRenderCallback(renderApp);
