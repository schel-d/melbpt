import { IndexPage } from "../pages/index/index-page";
import { finder } from "../utils/finder";

const html = {
  mainSearchInput: finder.input("main-search-input"),
  mainSearchForm: finder.any("main-search-form"),
  mainSearchResults: finder.div("main-search-results"),
  heroBG: finder.canvas("hero-bg"),
  hero: finder.any("hero")
};
export type IndexPageHtml = typeof html;

new IndexPage(html).init();
