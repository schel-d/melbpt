import { getElementOrThrow, getInputOrThrow } from "../dom-utils";
import { initNavbar } from "../page-template/navbar";
import { searchOptionsStops } from "../page-template/search";
import { displayResults, initSearch } from "../page-template/search-ui";

initNavbar();

const mainSearchInput = getInputOrThrow("main-search-input");
const mainSearchForm = getElementOrThrow("main-search-form");
const mainSearchResults = getElementOrThrow("main-search-results");

initSearch(
  mainSearchInput,
  mainSearchForm,
  (network) => searchOptionsStops(network),
  (results, message) => displayResults(mainSearchResults, results, message)
);
