import { initNetwork } from "../utils/network";

export abstract class Page<T> {
  html: T;

  constructor(html: T) {
    this.html = html;
  }

  abstract init(): Promise<void>;
}

// Todo: Temporary.
export type Settings = null;

export async function setupPage<T>(buildPage: () => Page<T>) {
  // Network and settings are both singleton objects.
  await initNetwork();
  //await initSettings();

  const page = buildPage();
  await page.init();
}
