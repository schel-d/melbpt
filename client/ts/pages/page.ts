import { initNavbar } from "../page-template/navbar";
import { checkOutdated, initSettings, Settings } from "../settings/settings";
import { reapplyTheme } from "../settings/theme";
import { getNetwork, initNetwork } from "../utils/network";

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

export async function setupPage<T>(buildPage: () => Page<T>) {
  // Network and settings are both singleton objects.
  await initNetwork(window.apiOrigin);
  const initialSettings = await initSettings(getNetwork());

  initNavbar();
  dealWithBFCache(initialSettings);

  const page = buildPage();
  await page.init();
}

export async function dealWithBFCache(initialSettings: Settings) {
  window.addEventListener("pageshow", (e) => {
    // Event runs when page is restored from bfcache.
    if (e.persisted) {
      // This is required, since the theme is NOT stored as part of the other
      // settings and so the theme might have changed while the below code may
      // not trigger a reload. This is instant anyway, so it's better!
      reapplyTheme();

      checkOutdated(initialSettings).then(outdated => {
        if (outdated) {
          location.reload();
        }
      });
    }
  });
}
