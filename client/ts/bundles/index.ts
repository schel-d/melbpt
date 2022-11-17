import { IndexPage } from "../pages/index/index-page";
import { setupPage } from "../pages/page";
import { finder } from "schel-d-utils-browser";

const html = {
  mainSearchInput: finder.input("main-search-input"),
  mainSearchForm: finder.any("main-search-form"),
  mainSearchResults: finder.div("main-search-results"),
  mainSearchResultsContainer: finder.div("main-search-results-container"),
  hero: finder.any("hero"),
  departuresParentDiv: finder.div("pinned-departures"),
  departuresDiv: finder.div("departures")
};
export type IndexPageHtml = typeof html;

setupPage(() => new IndexPage(html));
