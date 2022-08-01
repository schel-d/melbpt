import { domA, domDiv, domIconify, domP } from "../dom-utils";
import { getNetwork } from "../network";
import { search, SearchOption, searchOptionsWholeSite } from "./search";

/**
 * Message to display to the user if the search box is empty.
 */
const searchEmptyMessage = "Results will appear here.";

/**
 * Message to display to the user when they're searched for something, but
 * there's no results.
 */
const searchNoResultsMessage = "No results.";

/**
 * Message to display to the user if something goes wrong while trying to
 * search (the network information couldn't be downloaded).
 */
const searchFailedMessage = "Search failed. Make sure you're online.";

/**
 * The current results displaying in the search box. Stored globally so they can
 * be cleared by the {@link onSearchOpened} function.
 */
let currentResults: SearchOption[] = [];

export function initSearch(searchInput: HTMLInputElement,
  searchForm: HTMLElement, searchResultsDiv: HTMLElement) {

  let latestChangeID = 0;
  let networkHash: string | null = null;
  let options: SearchOption[] | null = null;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value;
    const changeID = latestChangeID + 1;
    latestChangeID = changeID;

    getNetwork().then(network => {
      // If by the time this promise resolves the input has changed, then do
      // nothing (otherwise we'll be competing with that promise).
      if (latestChangeID != changeID) { return; }

      if (network.hash != networkHash || options == null) {
        networkHash = network.hash;
        options = searchOptionsWholeSite(network);
      }

      if (query.length == 0) {
        searchMessage(searchEmptyMessage, searchResultsDiv);
        return;
      }

      const results = search(query, options);

      if (results.length == 0) {
        searchMessage(searchNoResultsMessage, searchResultsDiv);
        return;
      }

      searchResults(results, searchResultsDiv);
    }).catch(() => {
      // If by the time this promise resolves the input has changed, then do
      // nothing (otherwise we'll be competing with that promise).
      if (latestChangeID != changeID) { return; }

      searchMessage(searchFailedMessage, searchResultsDiv);
    });
  });

  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentResults.length > 0) {
      window.location.href = currentResults[0].url;
    }
  });
}

/**
 * Called when the user opened the expandable search menu. Clears the input
 * and results from the previous search.
 * @param searchInput The search box input element.
 * @param searchResultsDiv The div where the search results are shown.
 */
export function onSearchOpened(searchInput: HTMLInputElement,
  searchResultsDiv: HTMLElement) {

  // Clear the search box and results from last time.
  searchInput.value = "";
  searchMessage(searchEmptyMessage, searchResultsDiv);

  // Focus the search box, so the user can start typing immediately. Without
  // doing this after a short timeout, it doesn't work.
  setTimeout(() => { searchInput.focus(); }, 100);
}

/**
 * Clear the search results and display a message (e.g. "No results.") instead.
 * @param message
 * @param searchResultsDiv
 */
function searchMessage(message: string, searchResultsDiv: HTMLElement) {
  currentResults = [];

  const noResults = document.createElement("p");
  noResults.className = "message";
  noResults.textContent = message;

  searchResultsDiv.replaceChildren(noResults);
}

/**
 * Display the search results in the {@link searchResultsDiv}.
 * @param results The search results.
 * @param searchResultsDiv The div to display the search results inside.
 */
function searchResults(results: SearchOption[], searchResultsDiv: HTMLElement) {
  currentResults = results;

  /*
   *  Format:
   *
   *  <a class="result" href="{r.url}">
   *    <span class="iconify" data-icon="{r.icon}"></span>
   *    <div class="column">
   *      <div class="one-line">
   *        <p class="title">{r.title}</p>
   *      </div>
   *      <div class="one-line">
   *        <p class="subtitle">{r.subtitle}</p>
   *      </div>
   *    </div>
   *  </a>
   */

  // Create a link for each result.
  const resultsHTML = results.map(r => {
    const result = domA(r.url, "result");

    // Todo: Create the svg directly rather than waiting for iconify to populate
    // it.
    const icon = domIconify(r.icon);

    const column = domDiv("column");

    const titleWrapper = domDiv("one-line");
    const title = domP(r.title, "title");
    titleWrapper.append(title);
    column.append(titleWrapper);

    // Some search results don't have a subtitle, so don't create one if not
    // needed.
    if (r.subtitle != null) {
      const subtitleWrapper = domDiv("one-line");
      const subtitle = domP(r.subtitle, "subtitle");
      subtitleWrapper.append(subtitle);
      column.append(subtitleWrapper);
    }

    result.append(icon, column);
    return result;
  });

  searchResultsDiv.replaceChildren(...resultsHTML);
}
