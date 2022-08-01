import { initSearch, onSearchOpened } from "./navbar-search";

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

  initSearch(elements.searchInput, elements.searchForm, elements.searchResults);
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
    onSearchOpened(elements.searchInput, elements.searchResults);
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
