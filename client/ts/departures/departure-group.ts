import { StopID, stopIDZodSchema } from "melbpt-utils";
import { z } from "zod";
import { DepartureFilter } from "./departure-filter";

/** Data about a widget for a departures feed from a particular stop. */
export class DepartureGroup {
  /** The stop to get the departures from. */
  readonly stop: StopID;

  /** The filter to use on the departures. */
  readonly filter: DepartureFilter;

  /** Zod schema for parsing from JSON. */
  static json = z.object({
    stop: stopIDZodSchema,
    filter: DepartureFilter.json
  }).transform(x => new DepartureGroup(x.stop, x.filter));

  /** Zod schema for parsing from JSON but only using raw types. */
  static rawJson = z.object({
    stop: z.number(),
    filter: DepartureFilter.rawJson
  });

  /**
   * Creates a {@link DepartureGroup}.
   * @param stop The stop to get the departures from.
   * @param filter The filter to use on the departures.
   */
  constructor(stop: StopID, filter: DepartureFilter) {
    this.stop = stop;
    this.filter = filter;
  }

  /** Returns true if this departure group is the same as the other one. */
  equals(other: DepartureGroup): boolean {
    return this.stop == other.stop && this.filter.equals(other.filter);
  }

  /** Convert to JSON object according to {@link DepartureGroup.rawJson}. */
  toJSON(): z.infer<typeof DepartureGroup.rawJson> {
    return {
      stop: this.stop,
      filter: this.filter.toJSON()
    };
  }
}
