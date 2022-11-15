import { setupPage } from "../pages/page";
import { StaticPage } from "../pages/static/static-page";

const html = {};
export type StaticPageHtml = typeof html;

setupPage(() => new StaticPage(html));
