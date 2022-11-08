import { initNavbar } from "../page-template/navbar";
import { initNetwork } from "../utils/network";

declare global {
  interface Window { apiDomain: string }
}

init();

async function init() {
  // Network and settings are both singleton objects.
  await initNetwork();
  //await initSettings();

  initNavbar();

  window.addEventListener("pageshow", (e) => {
    // Event runs when page is restored from bfcache.
    if (e.persisted) {
      const theme = window.localStorage.getItem("melbpt-theme");
      if (theme == "light") {
        window.document.documentElement.classList.remove("dark");
        window.document.documentElement.classList.add("light");
      }
      else if (theme == "dark") {
        window.document.documentElement.classList.remove("light");
        window.document.documentElement.classList.add("dark");
      }
      else {
        // If theme is null or an unsupported value, use auto
        // (prefers-color-scheme).
        window.document.documentElement.classList.remove("light", "dark");
      }
    }
  });
}
