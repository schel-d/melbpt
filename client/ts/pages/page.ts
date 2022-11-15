import { initNavbar } from "../page-template/navbar";
import { initNetwork } from "../utils/network";

declare global {
  interface Window {
    apiOrigin: string
  }
}

export abstract class Page<T> {
  html: T;
  apiOrigin: string;

  constructor(html: T) {
    this.html = html;
    this.apiOrigin = window.apiOrigin;
  }

  abstract init(): Promise<void>;
}

// Todo: Temporary.
export type Settings = null;

export async function setupPage<T>(buildPage: () => Page<T>) {
  // Network and settings are both singleton objects.
  await initNetwork(window.apiOrigin);
  //await initSettings();

  initNavbar();
  dealWithBFCache();

  const page = buildPage();
  await page.init();
}

export async function dealWithBFCache() {
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
