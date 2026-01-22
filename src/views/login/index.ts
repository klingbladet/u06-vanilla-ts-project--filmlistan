export default function loginView(): HTMLElement {
  const container = document.createElement("div");
  container.className = "min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4";

  // En centrerad låda för Clerk
  const signInWrapper = document.createElement("div");
  signInWrapper.id = "clerk-sign-in";
  
  container.appendChild(signInWrapper);

  return container;
}