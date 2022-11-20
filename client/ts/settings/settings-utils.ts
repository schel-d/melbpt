/** The key used in local storage for the settings. */
export const settingsLSKey = "melbpt-settings";

/** Returns the JSON object in local storage or null if no data is present. */
export function getSettingsJson(): unknown {
  const jsonStr = localStorage.getItem(settingsLSKey);
  if (jsonStr == null) { return null; }
  return JSON.parse(jsonStr);
}

/** Returns the JSON object in local storage or null if no data is present. */
export function storeSettingsJson(json: unknown) {
  localStorage.setItem(settingsLSKey, JSON.stringify(json));
}

/** Return {@link a}, unless it is undefined, in which case return {@link b}. */
export function firstDefined<T>(a: T | undefined, b: T): T {
  return a == undefined ? b : a;
}
