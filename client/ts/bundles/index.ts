import { IndexPage } from "../pages/index/index-page";
import { setupPage } from "../pages/page";
import { finder } from "schel-d-utils-browser";

const html = {
  //heroBG: finder.canvas("hero-bg"),
  mainSearchInput: finder.input("main-search-input"),
  mainSearchForm: finder.any("main-search-form"),
  mainSearchResults: finder.div("main-search-results"),
  hero: finder.any("hero"),
  departuresDiv: finder.div("departures"),
  pinnedDeparturesGuideDiv: finder.div("pinned-departures-guide")
};
export type IndexPageHtml = typeof html;

setupPage(() => new IndexPage(html));
