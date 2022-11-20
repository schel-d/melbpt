import { SettingsV1 } from "./settings-v1";
import { getSettingsJson, storeSettingsJson } from "./settings-utils";
import { TransitNetwork } from "melbpt-utils";

/**
 * The current settings version. Saves having to change the types in every file
 * whenever the version number changes.
 */
export type Settings = SettingsV1;

/** The settings singleton. */
let settings: Settings | null = null;

/**
 * Load the settings from local storage and prepare the singleton for use.
 * @param network The network to validate against. Ensures the settings don't
 * refer to stops that no longer exist, for example.
 */
export async function initSettings(network: TransitNetwork): Promise<Settings> {
  settings = (await initSettingsNoCompliance()).ensureCompliance(network);
  return settings;
}

/** Load the settings from local storage and prepare the singleton for use. */
async function initSettingsNoCompliance(): Promise<Settings> {
  const json = getSettingsJson();

  // If there's no entry in local storage, use default settings.
  if (json == null) {
    console.warn(`Settings not found (new user?) - using defaults.`);
    settings = SettingsV1.default();
    return settings;
  }

  // Otherwise parse the settings. This function handles migrating from older
  // versions and using default settings if the JSON is corrupt.
  settings = SettingsV1.parse(json);
  return settings;
}

/**
 * Returns the previously loaded/updated settings. Throws an error if
 * {@link initSettings} has not been called yet for this page.
 */
export function getSettings(): Settings {
  if (settings == null) {
    throw new Error(
      "Settings was null. initSettings() should be called before the page is " +
      "initialized."
    );
  }
  return settings;
}

/**
 * Takes new settings and updates the settings singleton and local storage
 * value. Future calls to getSettings() will now return this value.
 * @param newSettings The new settings to save.
 */
export function updateSettings(newSettings: Settings) {
  settings = newSettings;
  storeSettingsJson(settings.toJSON());
}

/**
 * Check if the passed settings object is outdated.
 * @param settings The settings object to check.
 */
export async function checkOutdated(settings: Settings): Promise<boolean> {
  // Reload the settings from local storage and check the datetime.
  const lastUpdated = settings.lastUpdated;
  return (await initSettingsNoCompliance()).lastUpdated > lastUpdated;
}
