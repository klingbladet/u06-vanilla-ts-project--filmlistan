import "./style.css";
import { setRenderCallback } from "./lib/store.ts";

// Statiska sidor (behåll dessa eftersom de funkar i ditt projekt)
import headerHTML from "./views/static/header/index.html?raw";
import footerHTML from "./views/static/footer/index.html?raw";

// Dynamiska sidor
import about from "./views/about/index.ts";
import home from "./views/home/index.ts";
import watchlist from "./views/watchlist/index.ts";
import watched from "./views/watched/index.ts";

const app = document.querySelector("#app")!;

const currentPage = (): string | HTMLElement => {
  const path = window.location.pathname;

  switch (path) {
    case "/":
      return home();
    case "/about":
      return about();
    case "/watchlist":
      return watchlist();
    case "/watched":
      return watched();
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

const renderApp = () => {
  const page = currentPage();

  if (typeof page === "string") {
    app.innerHTML = `
      ${headerHTML}
      <main style="max-width: 1120px; margin: 0 auto; padding: 24px 16px;">
        <h1 style="margin: 0; font-size: 20px; color: white;">${page}</h1>
      </main>
      ${footerHTML}
    `;
  } else {
    app.innerHTML = `${headerHTML}${footerHTML}`;
    app.insertBefore(page, app.querySelector("footer")!);
  }

  setActiveNavLink();
};

renderApp();

window.addEventListener("popstate", () => {
  renderApp();
});

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
