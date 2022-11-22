import { DateTime } from "luxon";
import { TransitNetwork } from "melbpt-utils";
import { z } from "zod";
import { DepartureGroup } from "../departures/departure-group";
import { dateTimeZodSchema } from "../utils/time-utils";
import { firstDefined } from "./settings-utils";
import { SettingsV1 } from "./settings-v1";

// The version of settings in this file. Everytime a breaking change is made,
// such that the zod schema no longer parses data saved by the old version,
// a new file (e.g. settings-v3.ts) should be created. This variable in this
// file should remain as "v2", and the new file will have a similar const, which
// must be changed to "v3".
const version = "v2";

/** The maximum allowed number of pinned widgets. */
export const maxPinnedWidgets = 6;

/** Stores the user settings. */
export class SettingsV2 {
  /**
   * The version. Purely to ensure older versions cannot be mistaken for this
   * one and are migrated correctly.
   */
  readonly version = version;

  /** The time the settings were last changed. */
  readonly lastUpdated: DateTime;

  /** The widgets pinned to the index page. */
  readonly pinnedWidgets: DepartureGroup[];

  /** Whether to show continuations where appropriate. */
  readonly guessContinuations: boolean;

  /** Zod schema for parsing from JSON. */
  static json = z.object({
    version: z.string().refine(x => x == version),
    lastUpdated: dateTimeZodSchema,
    pinnedWidgets: DepartureGroup.json.array().max(maxPinnedWidgets),
    guessContinuations: z.boolean(),
  }).transform(x => new SettingsV2(
    x.lastUpdated, x.pinnedWidgets, x.guessContinuations
  ));

  /** Zod schema for parsing from JSON but only using raw types. */
  static rawJson = z.object({
    version: z.string(),
    lastUpdated: z.string(),
    pinnedWidgets: DepartureGroup.rawJson.array(),
    guessContinuations: z.boolean(),
  });

  /**
   * Creates a {@link SettingsV2}.
   * @param pinnedWidgets The widgets pinned to the index page.
   */
  constructor(lastUpdated: DateTime, pinnedWidgets: DepartureGroup[],
    guessContinuations: boolean) {

    if (pinnedWidgets.length > 6) {
      throw new Error(`Cannot have more than ${maxPinnedWidgets} pinned widgets.`);
    }

    this.lastUpdated = lastUpdated;
    this.pinnedWidgets = pinnedWidgets;
    this.guessContinuations = guessContinuations;
  }

  /**
   * Returns a new settings objects with some modifications, since settings
   * objects are immutable. The new settings object returned from this function
   * will always have the last updated field changed to the current time.
   * @param modifications The modifications to make.
   */
  with(modifications: SettingsV2Modifications): SettingsV2 {
    return new SettingsV2(
      DateTime.now(),
      firstDefined(modifications.pinnedWidgets, this.pinnedWidgets),
      firstDefined(modifications.guessContinuations, this.guessContinuations)
    );
  }

  /** Convert to JSON object according to {@link SettingsV2.rawJson}. */
  toJSON(): z.infer<typeof SettingsV2.rawJson> {
    return {
      version: this.version,
      pinnedWidgets: this.pinnedWidgets.map(x => x.toJSON()),
      lastUpdated: this.lastUpdated.toISO(),
      guessContinuations: this.guessContinuations
    };
  }

  /**
   * Returns the same settings object, but will any non-compliant values
   * according to the passed network removed/reset. This is necessary for in the
   * case where a user pins a widget for a stop that is later removed from the
   * transit network.
   * @param network The network to validate against.
   */
  ensureCompliance(network: TransitNetwork): SettingsV2 {
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
  static parse(json: unknown): SettingsV2 {
    try {
      // Will fail unless version is "v2" and matches the rest of the schema.
      return SettingsV2.json.parse(json);
    }
    catch {
      // Fall back to parsing settings v1 and migrating the changes. This
      // becomes recursive, since each past version will try the next past
      // version if it fails.
      console.warn(`JSON invalid for settings ${version} - trying v1.`);
      const oldSettings = SettingsV1.parse(json);

      return new SettingsV2(
        oldSettings.lastUpdated,
        oldSettings.pinnedWidgets,
        false
      );
    }
  }

  /** The settings to use for a new user or if the json is corrupted. */
  static default(): SettingsV2 {
    return new SettingsV2(DateTime.now(), [], false);
  }
}

/** The modifications to make. Undefined fields will use previous values. */
export type SettingsV2Modifications = {
  pinnedWidgets?: DepartureGroup[],
  guessContinuations?: boolean
}
