import { getNetwork } from "../network";
import { search, SearchOption, searchOptionsWholeSite } from "./search";

const searchEmptyMessage = "Results will appear here.";
const searchNoResultsMessage = "No results.";

let currentResults: SearchOption[] = [];

type NavbarElements = {
  navbarHousing: HTMLElement,
  navbarBg: HTMLElement,
  menuButton: HTMLElement,
  fullSearchButton: HTMLElement,
  iconSearchButton: HTMLElement,
  menu: HTMLElement,
  search: HTMLElement,
  searchForm: HTMLElement,
  searchInput: HTMLInputElement,
  searchResults: HTMLElement
}
type NavbarState = {
  blendMode: boolean,
  menuOpen: boolean,
  searchOpen: boolean
}

function getNavbarElements(): NavbarElements {
  const getElementOrThrow = (id: string): HTMLElement => {
    const element = document.getElementById(id);
    if (element != null) { return element; }
    throw new Error(`Element not found: #${id}`);
  };
  const getInputOrThrow = (id: string): HTMLInputElement => {
    const element = getElementOrThrow(id);
    if (element instanceof HTMLInputElement) { return element; }
    throw new Error(`Element not an input: #${id}`);
  };
  return {
    navbarHousing: getElementOrThrow("navbar-housing"),
    navbarBg: getElementOrThrow("navbar-bg"),
    menuButton: getElementOrThrow("navbar-menu-button"),
    fullSearchButton: getElementOrThrow("navbar-search-full-button"),
    iconSearchButton: getElementOrThrow("navbar-search-icon-button"),
    menu: getElementOrThrow("navbar-expandable-menu-container"),
    search: getElementOrThrow("navbar-expandable-search-container"),
    searchForm: getElementOrThrow("navbar-expandable-search-form"),
    searchInput: getInputOrThrow("navbar-expandable-search-input"),
    searchResults: getElementOrThrow("navbar-expandable-search-results")
  };
}

export function initNavbar() {
  const elements = getNavbarElements();
  const state: NavbarState = {
    blendMode: true,
    menuOpen: false,
    searchOpen: false
  };

  window.addEventListener("scroll", () => {
    updateBlendMode(elements, state);
  });

  elements.menuButton.addEventListener("click", () => {
    toggleMenu(elements, state);
  });

  elements.fullSearchButton.addEventListener("click", () => {
    toggleSearch(elements, state);
  });
  elements.iconSearchButton.addEventListener("click", () => {
    toggleSearch(elements, state);
  });

  document.addEventListener("click", (e) => {
    handleDocClickedDismissExpandables(e, elements, state);
  });

  updateBlendMode(elements, state);

  initSearch(elements);
}

function updateBlendMode(elements: NavbarElements, state: NavbarState) {
  const newBlendMode = window.scrollY < 1 && !state.menuOpen && !state.searchOpen;
  if (state.blendMode != newBlendMode) {
    state.blendMode = newBlendMode;
    setClass(elements.navbarBg, "blend", newBlendMode);
  }
}

function toggleMenu(elements: NavbarElements, state: NavbarState) {
  if (state.searchOpen) {
    toggleSearch(elements, state);
  }

  state.menuOpen = !state.menuOpen;
  updateBlendMode(elements, state);
  setClass(elements.menu, "open", state.menuOpen);
}

function toggleSearch(elements: NavbarElements, state: NavbarState) {
  if (state.menuOpen) {
    toggleMenu(elements, state);
  }

  state.searchOpen = !state.searchOpen;
  updateBlendMode(elements, state);
  setClass(elements.search, "open", state.searchOpen);

  if (state.searchOpen) {
    elements.searchInput.value = "";
    searchMessage(searchEmptyMessage, elements);

    // Without doing this after a short timeout, it doesn't work.
    setTimeout(() => { elements.searchInput.focus(); }, 100);
  }
}

function handleDocClickedDismissExpandables(e: MouseEvent, elements: NavbarElements,
  state: NavbarState) {

  const clickedElement = e.target as HTMLElement;
  const clickOutsideNavbar = elements.navbarHousing.contains(clickedElement);

  if (state.searchOpen && !clickOutsideNavbar) {
    toggleSearch(elements, state);
  }
  if (state.menuOpen && !clickOutsideNavbar) {
    toggleMenu(elements, state);
  }
}

function setClass(element: HTMLElement, className: string, value: boolean) {
  if (value) { element.classList.add(className); }
  else { element.classList.remove(className); }
}

function initSearch(elements: NavbarElements) {
  let latestChangeID = 0;
  let networkHash: string | null = null;

  let options: SearchOption[] | null = null;

  elements.searchInput.addEventListener("input", () => {
    const query = elements.searchInput.value;
    const changeID = latestChangeID + 1;
    latestChangeID = changeID;

    getNetwork()
      .then(network => {
        // If by the time this promise resolves the input has changed, then do
        // nothing (otherwise we'll be competing with that promise).
        if (latestChangeID != changeID) { return; }

        if (network.hash != networkHash || options == null) {
          networkHash = network.hash;
          options = searchOptionsWholeSite(network);
        }

        if (query.length == 0) {
          searchMessage(searchEmptyMessage, elements);
          return;
        }

        const results = search(query, options);

        if (results.length == 0) {
          searchMessage(searchNoResultsMessage, elements);
          return;
        }

        searchResults(results, elements);
      })
      .catch(err => {
        // If by the time this promise resolves the input has changed, then do
        // nothing (otherwise we'll be competing with that promise).
        if (latestChangeID != changeID) { return; }
        searchMessage("Search failed. Make sure you're online.", elements);
        console.error(err);
      });
  });

  elements.searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (currentResults.length > 0) {
      window.location.href = currentResults[0].url;
    }
  });
}

function searchMessage(message: string, elements: NavbarElements) {
  currentResults = [];

  const noResults = document.createElement("p");
  noResults.className = "message";
  noResults.textContent = message;

  elements.searchResults.replaceChildren(noResults);
}
function searchResults(results: SearchOption[], elements: NavbarElements) {
  currentResults = results;

  const resultsHTML = results.map(r => {
    const result = document.createElement("a");
    result.className = "result";
    result.href = r.url;

    const icon = document.createElement("span");
    icon.className = "iconify";
    icon.dataset.icon = r.icon;

    const column = document.createElement("div");
    column.className = "column";

    const titleWrapper = document.createElement("div");
    titleWrapper.className = "one-line";
    const title = document.createElement("p");
    title.className = "title";
    title.textContent = r.title;
    titleWrapper.append(title);
    column.append(titleWrapper);

    if (r.subtitle != null) {
      const subtitleWrapper = document.createElement("div");
      subtitleWrapper.className = "one-line";
      const subtitle = document.createElement("p");
      subtitle.className = "subtitle";
      subtitle.textContent = r.subtitle;
      subtitleWrapper.append(subtitle);
      column.append(subtitleWrapper);
    }

    result.append(icon, column);
    return result;
  });

  elements.searchResults.replaceChildren(...resultsHTML);
}
