import { initHeroBG } from "./hero-bg";
import { searchOptionsStops } from "../../page-template/search";
import { displayResults, initSearch } from "../../page-template/search-ui";
import { Page } from "../page";
import { IndexPageHtml } from "../../bundles";

/**
 * Controls interactivity on the index page.
 */
export class IndexPage extends Page<IndexPageHtml> {
  constructor(html: IndexPageHtml) {
    super(html);
  }

  async init() {
    initSearch(
      this.html.mainSearchInput,
      this.html.mainSearchForm,
      (network) => searchOptionsStops(network),
      (results, message) => displayResults(this.html.mainSearchResults, results, message)
    );
    initHeroBG(this.html.heroBG, this.html.hero);
  }
}
