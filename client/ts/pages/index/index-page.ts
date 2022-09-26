import { getCanvasOrThrow, getElementOrThrow, getInputOrThrow }
  from "../../utils/dom-utils";
import { initHeroBG } from "./hero-bg";
import { searchOptionsStops } from "../../page-template/search";
import { displayResults, initSearch } from "../../page-template/search-ui";
import { Page } from "../page";

/**
 * Controls interactivity on the index page.
 */
export class IndexPage extends Page {
  mainSearchInput: HTMLInputElement;
  mainSearchForm: HTMLElement;
  mainSearchResults: HTMLElement;

  heroBG: HTMLCanvasElement;
  hero: HTMLElement;

  constructor() {
    super();
    this.mainSearchInput = getInputOrThrow("main-search-input");
    this.mainSearchForm = getElementOrThrow("main-search-form");
    this.mainSearchResults = getElementOrThrow("main-search-results");
    this.heroBG = getCanvasOrThrow("hero-bg");
    this.hero = getElementOrThrow("hero");
  }

  async init() {
    initSearch(
      this.mainSearchInput,
      this.mainSearchForm,
      (network) => searchOptionsStops(network),
      (results, message) => displayResults(this.mainSearchResults, results, message)
    );
    initHeroBG(this.heroBG, this.hero);
  }
}
