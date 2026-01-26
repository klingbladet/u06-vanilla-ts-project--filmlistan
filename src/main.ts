import "./style.css";
import { createHeader } from "./views/static/header/index";
import footerHTML from "./views/static/footer/index.html?raw";

// Vyer
import home from "./views/home/index.ts";
import watchlist from "./views/watchlist/index.ts";
import watched from "./views/watched/index.ts";
import loginView from "./views/login/index.ts";
import authRequired from "./views/auth-required/index.ts";
import { Clerk } from '@clerk/clerk-js';


// Hämta nyckel
const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!pubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

export const clerk = new Clerk(pubKey);
// @ts-ignore
window.Clerk = clerk;
const app = document.querySelector<HTMLDivElement>("#app")!;

// --- ROUTER ---
const getCurrentPageContent = (): string | HTMLElement => {
  const path = window.location.pathname;

  // Skyddade rutter
  if ((path === "/watchlist" || path === "/watched") && !clerk.user) {
    return authRequired("Du måste logga in för att se denna sida.");
  }

  switch (path) {
    case "/":
      return home(!!clerk.user);
    case "/watchlist":
      return watchlist(!!clerk.user);
    case "/watched":
      return watched(!!clerk.user);
    case "/login":
      // Om man redan är inloggad och går till /login -> skicka till hem
      if (clerk.user) {
        window.history.replaceState({}, "", "/");
        return home(!!clerk.user);
      }
      return loginView();
    default:
      return "404 - Sidan hittades inte";
  }
};

// --- RENDER ---
async function renderApp() {
  // 1. Töm appen
  app.innerHTML = "";

  // 2. Skapa och lägg till Header
  const header = createHeader(!!clerk.user);
  app.appendChild(header);

  // 3. Hämta och lägg till sidinnehåll
  const content = getCurrentPageContent();
  
  const main = document.createElement("main");
  main.className = "mx-auto max-w-7xl px-4 py-10 text-white/80 min-h-[calc(100vh-200px)]"; // Min-height för att footern inte ska flyga upp

  if (typeof content === "string") {
    main.innerHTML = `<h1 class="text-xl font-bold">${content}</h1>`;
  } else {
    main.appendChild(content);
  }
  
  app.appendChild(main);

  // 4. Lägg till Footer
  const footer = document.createElement("div");
  footer.innerHTML = footerHTML;
  app.appendChild(footer);

  // 5. Efter-rendering logik (Montera Clerk komponenter)
  
  // A. Montera UserButton i headern om vi är inloggade
  if (clerk.user) {
    const userBtnDiv = document.getElementById("clerk-user-button") as HTMLDivElement;
    if (userBtnDiv) {
      clerk.mountUserButton(userBtnDiv);
    }
  }

  // B. Montera SignIn om vi är på inloggningssidan
  if (window.location.pathname === "/login") {
    const signInDiv = document.getElementById("clerk-sign-in") as HTMLDivElement;
    if (signInDiv) {
      clerk.mountSignIn(signInDiv, {
        appearance: {
          variables: {
            colorPrimary: 'rgba(191, 0, 32, 0.95)' // Amber-400 för att matcha din design
          }
        }
      });
    }
  }

  // C. Uppdatera aktiv länk styling
  updateActiveLink();
}

function updateActiveLink() {
  const path = window.location.pathname;
  document.querySelectorAll(".nav-link").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) {
      a.classList.add("bg-white/10", "text-white/80");
      a.classList.remove("text-white/70");
    } else {
      a.classList.remove("bg-white/10", "text-white/80");
      a.classList.add("text-white/70");
    }
  });
}

// --- INIT ---
async function init() {
  await clerk.load();
  renderApp();
}

// Starta
init();

// --- EVENTS ---
// Hantera navigation utan omladdning (SPA)
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const link = target.closest("a");
  
  if (!link) return;
  // Om det är en extern länk eller har target="_blank", låt den vara
  if (!link.href.startsWith(window.location.origin) || link.target === "_blank") return;
  
  e.preventDefault();
  const path = new URL(link.href).pathname;
  window.history.pushState({}, "", path);
  renderApp();
});

// Hantera bakåt/framåt-knappar i webbläsaren
window.addEventListener("popstate", () => renderApp());