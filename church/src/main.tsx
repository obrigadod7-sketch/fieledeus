import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// HashRouter: keep in-page anchors (#celulas) scrolling instead of routing; open external links in a new tab
const scrollTo = (id: string, tries = 20) => {
  const el = document.getElementById(id);
  if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
  if (tries > 0) setTimeout(() => scrollTo(id, tries - 1), 100);
};

document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest("a");
  if (!a) return;
  const href = a.getAttribute("href") || "";
  if (href.startsWith("#") && !href.startsWith("#/")) {
    e.preventDefault();
    const id = href.slice(1);
    if (!id) return;
    if (!document.getElementById(id)) window.location.hash = "#/";
    scrollTo(id);
    return;
  }
  if (/^https?:\/\//.test(href) && !href.startsWith(window.location.origin)) {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noreferrer");
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
