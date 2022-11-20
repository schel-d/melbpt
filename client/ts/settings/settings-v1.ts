import { DateTime } from "luxon";
import { TransitNetwork } from "melbpt-utils";
import { z } from "zod";
import { DepartureGroup } from "../departures/departure-group";
import { dateTimeZodSchema } from "../utils/time-utils";
import { firstDefined } from "./settings-utils";

// The version of settings in this file. Everytime a breaking change is made,
// such that the zod schema no longer parses it (new additions are fine, but
// removals, renames, and other modification will break it) a new file,
// (e.g. settings-v2.ts) should be created. This variable in this file should
// remain as "v1", and the new file will have a similar const, which must be
// changed to "v2".
const version = "v1";

/** The maximum allowed number of pinned widgets. */
export const maxPinnedWidgets = 6;

/** Stores the user settings. */
export class SettingsV1 {
  /**
   * The version. Purely to ensure older versions cannot be mistaken for this
   * one and are migrated correctly.
   */
  readonly version = version;

  /** The time the settings were last changed. */
  readonly lastUpdated: DateTime;

  /** The widgets pinned to the index page. */
  readonly pinnedWidgets: DepartureGroup[];

  /** Zod schema for parsing from JSON. */
  static json = z.object({
    version: z.string().refine(x => x == version),
    pinnedWidgets: DepartureGroup.json.array().max(maxPinnedWidgets),
    lastUpdated: dateTimeZodSchema
  }).transform(x => new SettingsV1(x.lastUpdated, x.pinnedWidgets));

  /** Zod schema for parsing from JSON but only using raw types. */
  static rawJson = z.object({
    version: z.string(),
    pinnedWidgets: DepartureGroup.rawJson.array(),
    lastUpdated: z.string()
  });

  /**
   * Creates a {@link SettingsV1}.
   * @param pinnedWidgets The widgets pinned to the index page.
   */
  constructor(lastUpdated: DateTime, pinnedWidgets: DepartureGroup[]) {
    if (pinnedWidgets.length > 6) {
      throw new Error(`Cannot have more than ${maxPinnedWidgets} pinned widgets.`);
    }

    this.lastUpdated = lastUpdated;
    this.pinnedWidgets = pinnedWidgets;
  }

  /**
   * Returns a new settings objects with some modifications, since settings
   * objects are immutable. The new settings object returned from this function
   * will always have the last updated field changed to the current time.
   * @param modifications The modifications to make.
   */
  with(modifications: SettingsV1Modifications): SettingsV1 {
    return new SettingsV1(
      DateTime.now(),
      firstDefined(modifications.pinnedWidgets, this.pinnedWidgets)
    );
  }

  /** Convert to JSON object according to {@link SettingsV1.rawJson}. */
  toJSON(): z.infer<typeof SettingsV1.rawJson> {
    return {
      version: this.version,
      pinnedWidgets: this.pinnedWidgets.map(x => x.toJSON()),
      lastUpdated: this.lastUpdated.toISO()
    };
  }

  /**
   * Returns the same settings object, but will any non-compliant values
   * according to the passed network removed/reset. This is necessary for in the
   * case where a user pins a widget for a stop that is later removed from the
   * transit network.
   * @param network The network to validate against.
   */
  ensureCompliance(network: TransitNetwork): SettingsV1 {
    // Is changed to true if any changes are made.
    let dirty = false;

    // Remove any pinned widgets if their stops no longer exist in the network.
    const newPinnedWidgets = this.pinnedWidgets
      .filter(x => network.getStop(x.stop) != null);
    if (newPinnedWidgets.length != this.pinnedWidgets.length) {
      dirty = true;
    }

    // Only call .with if changes are made so the last updated time is left
    // unchanged.
    if (dirty) {
      console.warn("Current settings are partially invalid, using modified settings.");
      return this.with({
        pinnedWidgets: newPinnedWidgets
      });
    }
    else {
      return this;
    }
  }

  /**
   * Parses the settings object from json. Handles migrating the settings from
   * older versions if possible, or resorting to default settings when the json
   * is corrupted.
   * @param json The json to parse from.
   */
  static parse(json: unknown): SettingsV1 {
    try {
      // Will fail unless version is "v1" and matches the rest of the schema.
      return SettingsV1.json.parse(json);
    }
    catch {
      // Note: For settings V2, fall back to parsing settings v1 and migrating
      // the changes. Since this becomes recursive, settings v3 only has to
      // worry about migrating from v2, because v2 will handle migrating from
      // v1 if needed.
      console.warn(`JSON invalid for settings ${version} - using defaults.`);
      return SettingsV1.default();
    }
  }

  /** The settings to use for a new user or if the json is corrupted. */
  static default(): SettingsV1 {
    return new SettingsV1(DateTime.now(), []);
  }
}

/** The modifications to make. Undefined fields will use previous values. */
export type SettingsV1Modifications = {
  pinnedWidgets?: DepartureGroup[]
}
