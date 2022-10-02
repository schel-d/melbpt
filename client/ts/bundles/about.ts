import { AboutPage } from "../pages/about/about-page";
import { finder } from "../utils/finder";

const html = {
  loadingDiv: finder.div("timetables-loading"),
  errorDiv: finder.div("timetables-error"),
  timetablesList: finder.any("timetables-list"),
};
export type AboutPageHtml = typeof html;

new AboutPage(html).init();
