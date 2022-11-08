import { searchOptionsWholeSite } from "./search";
import { ClearSearchAction, displayResults, initSearch } from "./search-ui";

/**
 * Store the function that clears the navbar search box for use in
 * {@link onSearchOpened}.
 */
let clearAction: ClearSearchAction | null = null;

/**
 * Hooks up the events to the search box in the navbar.
 * @param searchInput The input element to listen for the search query from.
 * @param searchForm Form element containing the search input. When this form is
 * submitted, the first result will be navigated to if available.
 * @param searchResultsDiv The div to display the search results as you type.
 */
export function initNavbarSearch(searchInput: HTMLInputElement,
  searchForm: HTMLElement, searchResultsDiv: HTMLElement) {

  clearAction = initSearch(
    searchInput,
    searchForm,
    () => searchOptionsWholeSite(),
    (results, message) => displayResults(searchResultsDiv, results, message)
  );
}

/**
 * Called when the user opened the expandable search menu. Clears the input
 * and results from the previous search.
 * @param searchInput The search box input element.
 */
export function onSearchOpened(searchInput: HTMLInputElement) {
  // Clear the search box and results from last time.
  if (clearAction) {
    clearAction();
  }

  // Focus the search box, so the user can start typing immediately. Without
  // doing this after a short timeout, it doesn't work.
  setTimeout(() => { searchInput.focus(); }, 100);
}
