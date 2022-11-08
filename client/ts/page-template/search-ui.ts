import { domA, domDiv, domIconify, domP } from "../utils/dom-utils";
import { getNetwork } from "../utils/network";
import { search, SearchOption } from "./search";

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
 * Function that returns the list of options that can be searched in the
 * associated search UI.
 */
export type OptionsFactory = () => SearchOption[];

/**
 * Function called whenever search results are available, or a message should
 * be shown to the user regarding the search.
 */
export type ResultsCallback =
  (results: SearchOption[] | null, message: string | null) => void;

/**
 * Function returned to the caller of {@link initSearch} that allows when to
 * clear the search UI.
 */
export type ClearSearchAction = () => void;

/**
 * Treats the given {@link searchInput} as a search box, and calls the
 * {@link resultsCallback} whenever results are available and should be
 * displayed. Returns a function that allows the caller of this function to
 * clear the search input and results.
 * @param searchInput The input element to listen for the search query from.
 * @param searchForm An optional form element containing the search input. When
 * this form is submitted, the first result will be navigated to if available.
 * @param optionsFactory A function returning a list of options to be searched.
 * @param resultsCallback The callback run whenever search results are available
 * to display.
 */
export function initSearch(searchInput: HTMLInputElement,
  searchForm: HTMLElement | null, optionsFactory: OptionsFactory,
  resultsCallback: ResultsCallback): ClearSearchAction {

  resultsCallback(null, searchEmptyMessage);

  // Always stores the current results of this search UI. This allows the first
  // result to be navigated to when enter is pressed.
  let results: SearchOption[] = [];

  // Keep track of the network object that the following options array was
  // created with. If a later key event manages to retrieve a newer version of
  // the network information, only then will we rebuild the options array. It
  // would be stupid to regenerate the array for every keystroke.
  let networkHash: string | null = null;
  let options: SearchOption[] | null = null;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value;

    // Only generate a list of options if you haven't already, or a new
    // version of the network data has been retrieved.
    if (getNetwork().hash != networkHash || options == null) {
      networkHash = getNetwork().hash;
      options = optionsFactory();
    }

    // If the search box is empty, show a message. Don't bother performing the
    // search.
    if (query.length == 0) {
      results = [];
      resultsCallback(null, searchEmptyMessage);
      return;
    }

    // Perform the search.
    results = search(query, options);

    // If there were no results, show a message.
    if (results.length == 0) {
      resultsCallback(null, searchNoResultsMessage);
      return;
    }

    // Otherwise, show those results.
    resultsCallback([...results], null);
  });

  // The submitted form (enter key) functionality is optional.
  if (searchForm != null) {
    // When the user hits enter while searching...
    searchForm.addEventListener("submit", (e) => {
      // Stop the form doing a get/post. We're overriding "enter".
      e.preventDefault();

      if (results.length > 0) {
        // If we're currently showing results, select the first one and navigate
        // there.
        window.location.href = results[0].url;
      }
    });
  }

  // Returns a function that clears this search UI when run. This allows the
  // caller to clear when the search results when they want to (otherwise
  // they'd somehow need access to the results array stored in this function).
  const clearSearchAction = () => {
    results = [];
    searchInput.value = "";
    resultsCallback(null, searchEmptyMessage);
  };
  return clearSearchAction;
}

/**
 * Displays the search results in the given div element.
 *
 * Format for each result:
 *
 * ```html
 * <a class="result" href="{result.url}">
 *   <svg class="iconify"...> ... </svg>
 *   <div class="column">
 *     <div class="one-line">
 *       <p class="title">{result.title}</p>
 *     </div>
 *     <div class="one-line">
 *       <p class="subtitle">{result.subtitle}</p>
 *     </div>
 *   </div>
 * </a>
 * ```
 *
 * In the case where there are no results, and a message is instead provided,
 * the div content will be:
 *
 * ```html
 * <p class="message">{message}</p>
 * ```
 * @param results The search results.
 */
export function displayResults(div: HTMLElement, results: SearchOption[] | null,
  message: string | null) {

  if (results != null) {
    div.replaceChildren(...createResultsHtml(results));
  }
  else if (message != null) {
    const messageHtml = document.createElement("p");
    messageHtml.className = "message";
    messageHtml.textContent = message;
    div.replaceChildren(messageHtml);
  }
  else {
    // I guess if nothing is passed, we'll just empty it?
    div.replaceChildren();
  }
}

/**
 * Returns the search results as HTML elements ready to be added to the DOM.
 *
 * Format:
 *
 * ```html
 * <a class="result" href="{result.url}">
 *   <svg class="iconify"...> ... </svg>
 *   <div class="column">
 *     <div class="one-line">
 *       <p class="title">{result.title}</p>
 *     </div>
 *     <div class="one-line">
 *       <p class="subtitle">{result.subtitle}</p>
 *     </div>
 *   </div>
 * </a>
 * ```
 * @param results The search results.
 */
function createResultsHtml(results: SearchOption[]): HTMLElement[] {
  // Create a link for each result.
  const resultsHTML = results.map(r => {
    const result = domA(r.url, "result");

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

  return resultsHTML;
}
