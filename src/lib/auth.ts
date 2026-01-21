type User = {
    email: string;
  };
  
  const LS_USER_KEY = "filmkollen_user";
  
  // Demo (”riktig” login i appen = fungerar, men inte säker som backend-auth)
  const DEMO_EMAIL = "demo@filmkollen.se";
  const DEMO_PASSWORD = "film123";
  
  export function getUser(): User | null {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
  
  export function isLoggedIn(): boolean {
    return Boolean(getUser());
  }
  
  export function login(email: string, password: string): { ok: true } | { ok: false; message: string } {
    const e = email.trim().toLowerCase();
    const p = password.trim();
  
    if (!e || !p) return { ok: false, message: "Fyll i e-post och lösenord." };
  
    if (e !== DEMO_EMAIL || p !== DEMO_PASSWORD) {
      return { ok: false, message: "Fel e-post eller lösenord. Testa demo@filmkollen.se / film123" };
    }
  
    localStorage.setItem(LS_USER_KEY, JSON.stringify({ email: e }));
    return { ok: true };
  }
  
  export function logout() {
    localStorage.removeItem(LS_USER_KEY);
  }
  