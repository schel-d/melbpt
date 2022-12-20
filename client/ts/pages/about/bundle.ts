import { AboutPage } from "./about-page";
import { setupPage } from "../page";
import { find } from "schel-d-utils-browser";

const html = {
  loadingDiv: find.div("timetables-loading"),
  errorDiv: find.div("timetables-error"),
  timetablesList: find.any("timetables-list"),
};
export type AboutPageHtml = typeof html;

setupPage(() => new AboutPage(html));
