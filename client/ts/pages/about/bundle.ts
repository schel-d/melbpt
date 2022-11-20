import { AboutPage } from "./about-page";
import { setupPage } from "../page";
import { finder } from "schel-d-utils-browser";

const html = {
  loadingDiv: finder.div("timetables-loading"),
  errorDiv: finder.div("timetables-error"),
  timetablesList: finder.any("timetables-list"),
};
export type AboutPageHtml = typeof html;

setupPage(() => new AboutPage(html));
