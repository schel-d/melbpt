type NavbarElements = {
  navbarBg: HTMLElement,
  menuButton: HTMLElement,
  fullSearchButton: HTMLElement,
  iconSearchButton: HTMLElement,
  menu: HTMLElement,
  search: HTMLElement,
  searchInput: HTMLElement,
}
type NavbarState = {
  blendMode: boolean,
  menuOpen: boolean,
  searchOpen: boolean
}

function getNavbarElements(): NavbarElements {
  const getElementOrThrow = (id: string): HTMLElement => {
    const element = document.getElementById(id);
    if (element == null) { throw new Error(`Element not found: #${id}`); }
    return element;
  };
  return {
    navbarBg: getElementOrThrow("navbar-bg"),
    menuButton: getElementOrThrow("navbar-menu-button"),
    fullSearchButton: getElementOrThrow("navbar-search-full-button"),
    iconSearchButton: getElementOrThrow("navbar-search-icon-button"),
    menu: getElementOrThrow("navbar-expandable-menu"),
    search: getElementOrThrow("navbar-expandable-search"),
    searchInput: getElementOrThrow("navbar-expandable-search-input")
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

  updateBlendMode(elements, state);
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
}

function setClass(element: HTMLElement, className: string, value: boolean) {
  if (value) { element.classList.add(className); }
  else { element.classList.remove(className); }
}
