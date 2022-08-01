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
 * be cleared by the {@link onSearchOpened} function. Kept updated by the
 * {@link showResults} and {@link showMessage} functions.
 */
let currentResults: SearchOption[] = [];

export function initSearch(searchInput: HTMLInputElement,
  searchForm: HTMLElement, searchResultsDiv: HTMLElement) {

  // If multiple keystrokes occur while the network informtaion is being
  // retrieved only the event handler for the last keystroke should run. Each
  // event changes this number so they can check later to make sure they're
  // still the current one.
  let latestChangeID = 0;

  // Keep track of the network object that the following options array was
  // created with. If a later key event manages to retrieve a newer version of
  // the network information, only then will we rebuild the options array. It
  // would be stupid to regenerate the array for every keystroke.
  let networkHash: string | null = null;
  let options: SearchOption[] | null = null;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value;

    // Take a copy of the current value of the change ID, and change it for the
    // next keystroke.
    const changeID = latestChangeID + 1;
    latestChangeID = changeID;

    getNetwork().then(network => {
      // If by the time this promise resolves another keystroke has occured,
      // then do nothing (otherwise we'll be competing with that handler).
      if (latestChangeID != changeID) { return; }

      // Only generate a list of options if you haven't already, or a new
      // version of the network data has been retrieved.
      if (network.hash != networkHash || options == null) {
        networkHash = network.hash;
        options = searchOptionsWholeSite(network);
      }

      // If the search box is empty, show a message. Don't bother performing the
      // search.
      if (query.length == 0) {
        showMessage(searchEmptyMessage, searchResultsDiv);
        return;
      }

      // Perform the search.
      const results = search(query, options);

      // If there were no results, show a message.
      if (results.length == 0) {
        showMessage(searchNoResultsMessage, searchResultsDiv);
        return;
      }

      // Otherwise, show those results.
      showResults(results, searchResultsDiv);

    }).catch(() => {
      // If by the time this promise resolves another keystroke has occured,
      // then do nothing (otherwise we'll be competing with that handler).
      if (latestChangeID != changeID) { return; }

      // If an error occured, display a message telling the user an error
      // occured.
      showMessage(searchFailedMessage, searchResultsDiv);
    });
  });

  // When the user hits enter while searching...
  searchForm.addEventListener("submit", (e) => {
    // Stop the form doing a get/post. We're overriding "enter".
    e.preventDefault();

    if (currentResults.length > 0) {
      // If we're currently showing results, select the first one and navigate
      // there.
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
  showMessage(searchEmptyMessage, searchResultsDiv);

  // Focus the search box, so the user can start typing immediately. Without
  // doing this after a short timeout, it doesn't work.
  setTimeout(() => { searchInput.focus(); }, 100);
}

/**
 * Clear the search results and display a message (e.g. "No results.") instead.
 * @param message
 * @param searchResultsDiv
 */
function showMessage(message: string, searchResultsDiv: HTMLElement) {
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
function showResults(results: SearchOption[], searchResultsDiv: HTMLElement) {
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

  // Replace whatever was in the search results with the newly created html.
  searchResultsDiv.replaceChildren(...resultsHTML);
}
