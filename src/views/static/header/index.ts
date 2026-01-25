import { clerk } from "../../../main";

export function createHeader(isLoggedIn: boolean) {
  const header = document.createElement("header");
  header.className = "sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur";

  const div = document.createElement("div");
  div.className = "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3";

  // LOGO
  const anchor = document.createElement("a");
  anchor.setAttribute("href", "/");
  
  const img = document.createElement("img");
  img.src = "/img/logo-chasnchill-red.png";
  img.alt = "Logo";
  img.className = "w-auto max-h-12"; // Ändrade till tailwind klass för höjd (h-12 = ca 48px)
  anchor.appendChild(img);

  // NAV
  const nav = document.createElement("nav");
  nav.className = "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm";

  // Helper för att skapa länkar
  const createLink = (text: string, href: string) => {
    const a = document.createElement("a");
    a.className = "nav-link rounded-full px-3 py-2 text-xs font-semibold text-white/75 transition hover:bg-white/10 hover:text-white";
    a.textContent = text;
    a.href = href;
    return a;
  };

  const linkHome = createLink("Hem", "/");
  const linkWatchlist = createLink("Watchlist", "/watchlist");
  const linkWatched = createLink("Watched", "/watched");

  nav.append(linkHome, linkWatchlist, linkWatched);

  // AUTH SECTION
  // Här skapar vi en behållare. Antingen en "Logga in"-länk eller en div för UserButton.
  const authContainer = document.createElement("div");
  authContainer.className = "ml-2 flex items-center";

  if (isLoggedIn) {
    // Om inloggad: Skapa en div där Clerk kan montera sin knapp senare
    const userBtnDiv = document.createElement("div");
    userBtnDiv.id = "clerk-user-button"; 
    authContainer.appendChild(userBtnDiv);
  } else {
    // Om utloggad: Visa logga in länk
    const loginLink = createLink("Logga in", "/login");
    authContainer.appendChild(loginLink);
  }

  nav.appendChild(authContainer);
  div.append(anchor, nav);
  header.appendChild(div);

  return header;
}