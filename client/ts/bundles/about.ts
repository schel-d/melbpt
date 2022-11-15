import { AboutPage } from "../pages/about/about-page";
import { setupPage } from "../pages/page";
import { finder } from "schel-d-utils-browser";

declare global {
  interface Window {
    apiOrigin: string
  }
}

const html = {
  loadingDiv: finder.div("timetables-loading"),
  errorDiv: finder.div("timetables-error"),
  timetablesList: finder.any("timetables-list"),
};
export type AboutPageHtml = typeof html;

setupPage(() => new AboutPage(html, window.apiOrigin));
