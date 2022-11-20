// Theme is stored separately from the other settings on purpose, because the
// page template has a tiny script built-in to the start of it to ensure the
// theme is applied ASAP. That tiny script should have to deal with migrations
// between settings versions IMO, so it can be as fast as possible.

/** The key used in local storage for the theme. */
const themeLSKey = "melbpt-theme";

/** Gets the current theme, or null, meaning "auto". */
export function getTheme(): "light" | "dark" | null {
  const value = window.localStorage.getItem(themeLSKey);
  if (value == "light" || value == "dark") { return value; }
  return null;
}

/**
 * Saves the new theme.
 * @param newTheme The new theme, or null for "auto".
 */
export function setTheme(newTheme: "light" | "dark" | null,
  documentElement: HTMLElement) {

  if (newTheme == "light") {
    localStorage.setItem(themeLSKey, "light");
    documentElement.classList.remove("dark");
    documentElement.classList.add("light");
  }
  else if (newTheme == "dark") {
    localStorage.setItem(themeLSKey, "dark");
    documentElement.classList.remove("light");
    documentElement.classList.add("dark");
  }
  else {
    localStorage.removeItem(themeLSKey);
    documentElement.classList.remove("light", "dark");
  }

  // Note that the settings object isn't updated (and therefore no page reload
  // when restoring from the BFCache). This is because the theme can fairly
  // easily just be applied to the existing page (using reapplyTheme() below).
}

/**
 * Applies the current theme to the page. This shouldn't be required except
 * when unfreezing the page from BFCache, since the tiny script built into the
 * page template's HTML handles applying the correct theme.
 */
export function reapplyTheme() {
  const theme = getTheme();
  if (theme == "light") {
    window.document.documentElement.classList.remove("dark");
    window.document.documentElement.classList.add("light");
  }
  else if (theme == "dark") {
    window.document.documentElement.classList.remove("light");
    window.document.documentElement.classList.add("dark");
  }
  else {
    window.document.documentElement.classList.remove("light", "dark");
  }
}
