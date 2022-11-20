import { setupPage } from "../page";
import { StaticPage } from "./static-page";

const html = {};
export type StaticPageHtml = typeof html;

setupPage(() => new StaticPage(html));
