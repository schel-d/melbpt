import { setDomClass } from "../utils/dom-utils";
import { finder } from "schel-d-utils-browser";
import { initNavbarSearch, onSearchOpened } from "./navbar-search";

/**
 * Retreives references to all the elements in the DOM related to the navbar.
 * Throws errors if any cannot be found.
 */
function getNavbarElements() {
  return {
    navbarHousing: finder.any("navbar-housing"),
    navbarBg: finder.any("navbar-bg"),
    menuButton: finder.any("navbar-menu-button"),
    fullSearchButton: finder.any("navbar-search-full-button"),
    iconSearchButton: finder.any("navbar-search-icon-button"),
    menu: finder.any("navbar-expandable-menu-container"),
    search: finder.any("navbar-expandable-search-container"),
    searchForm: finder.any("navbar-expandable-search-form"),
    searchInput: finder.input("navbar-expandable-search-input"),
    searchResults: finder.any("navbar-expandable-search-results")
  };
}

/**
 * An object containing references to the navbar elements in the DOM.
 */
type NavbarElements = ReturnType<typeof getNavbarElements>;

/**
 * The state of the navbar.
 */
type NavbarState = {
  blendMode: boolean,
  menuOpen: boolean,
  searchOpen: boolean
}

/**
 * Initialize the navbar so that it actually functions when the buttons on it
 * are clicked. This function should be called once each time a new page is
 * loaded, preferably by whatever sets up the rest of the page template's
 * interactivity.
 */
export function initNavbar() {
  // Initialize the elements and state.
  const elements = getNavbarElements();
  const state: NavbarState = {
    blendMode: true,
    menuOpen: false,
    searchOpen: false
  };

  // Allows the navbar to blend into the page when the page is scrolled to the
  // top, otherwise it has a solid background with a drop shadow.
  window.addEventListener("scroll", () => {
    updateBlendMode(elements, state);
  });

  // Opens the expandable menu if the menu (hamburger) button is clicked (for
  // small screens).
  elements.menuButton.addEventListener("click", () => {
    toggleMenu(elements, state);
  });

  // Opens the expandable search box if the search button is clicked. Event
  // appears twice because there are two different search buttons depending
  // on your screen size.
  elements.fullSearchButton.addEventListener("click", () => {
    toggleSearch(elements, state);
  });
  elements.iconSearchButton.addEventListener("click", () => {
    toggleSearch(elements, state);
  });

  // Allows an escape key or click outside an expandable menu to close it.
  document.addEventListener("click", (e) => {
    handleDocClickedDismissExpandables(e, elements, state);
  });
  document.addEventListener("keydown", (e) => {
    if (e.code == "Escape" && state.searchOpen) {
      toggleSearch(elements, state);
      e.preventDefault();
    }
    if (e.code == "Escape" && state.menuOpen) {
      toggleMenu(elements, state);
      e.preventDefault();
    }
  });

  // Make sure that even if the page is already scrolled down upen being opened,
  // the navbar is shown correctly.
  updateBlendMode(elements, state);

  // Initialize the search UI in the expandable menu.
  initNavbarSearch(elements.searchInput, elements.searchForm, elements.searchResults);
}

/**
 * Ensures that "blend" mode on the navbar background is disabled if the page
 * is scrolled or an expandable menu/search panel is open.
 */
function updateBlendMode(elements: NavbarElements, state: NavbarState) {
  const newBlendMode = window.scrollY < 1 && !state.menuOpen &&
    !state.searchOpen;

  if (state.blendMode != newBlendMode) {
    state.blendMode = newBlendMode;
    setDomClass(elements.navbarBg, "blend", newBlendMode);
  }
}

/**
 * Opens/closes the expandable menu. Closes other expandables if they're open.
 */
function toggleMenu(elements: NavbarElements, state: NavbarState) {
  if (state.searchOpen) {
    toggleSearch(elements, state);
  }

  state.menuOpen = !state.menuOpen;
  updateBlendMode(elements, state);
  setDomClass(elements.menu, "open", state.menuOpen);
}

/**
 * Opens/closes the expandable search UI. Closes other expandables if they're
 * open.
 */
function toggleSearch(elements: NavbarElements, state: NavbarState) {
  if (state.menuOpen) {
    toggleMenu(elements, state);
  }

  state.searchOpen = !state.searchOpen;
  updateBlendMode(elements, state);
  setDomClass(elements.search, "open", state.searchOpen);

  if (state.searchOpen) {
    // Clear the search box and results from last time.
    onSearchOpened(elements.searchInput);
  }
}

/**
 * Called for every click within the document. Closes the expandable menus if
 * a click occurs outside the navbar and they're open.
 * @param e The click event. Needed to determine whether click was outside.
 */
function handleDocClickedDismissExpandables(e: MouseEvent,
  elements: NavbarElements, state: NavbarState) {

  const clickedElement = e.target as HTMLElement;
  const clickOutsideNavbar = elements.navbarHousing.contains(clickedElement);

  if (state.searchOpen && !clickOutsideNavbar) {
    toggleSearch(elements, state);
    e.preventDefault();
  }
  if (state.menuOpen && !clickOutsideNavbar) {
    toggleMenu(elements, state);
    e.preventDefault();
  }
}
