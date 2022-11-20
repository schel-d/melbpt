import { IndexPage } from "./index-page";
import { setupPage } from "../page";
import { finder } from "schel-d-utils-browser";

const html = {
  mainSearchInput: finder.input("main-search-input"),
  mainSearchForm: finder.any("main-search-form"),
  mainSearchResults: finder.div("main-search-results"),
  hero: finder.any("hero"),
  departuresParentDiv: finder.div("pinned-departures"),
  departuresDiv: finder.div("departures")
};
export type IndexPageHtml = typeof html;

setupPage(() => new IndexPage(html));
