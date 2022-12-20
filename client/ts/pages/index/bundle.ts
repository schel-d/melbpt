import { IndexPage } from "./index-page";
import { setupPage } from "../page";
import { find } from "schel-d-utils-browser";

const html = {
  mainSearchInput: find.input("main-search-input"),
  mainSearchForm: find.any("main-search-form"),
  mainSearchResults: find.div("main-search-results"),
  hero: find.any("hero"),
  departuresParentDiv: find.div("pinned-departures"),
  departuresDiv: find.div("departures")
};
export type IndexPageHtml = typeof html;

setupPage(() => new IndexPage(html));
