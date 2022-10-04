import { IndexPage } from "../pages/index/index-page";
import { finder } from "../utils/finder";

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

new IndexPage(html).init();
