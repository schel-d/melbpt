import { DateTime } from "luxon";
import { encodeURI } from "js-base64";
import {
  directionIDZodSchema, lineIDZodSchema, platformIDZodSchema, StopID, stopIDZodSchema,
} from "melbpt-utils";
import { z } from "zod";
import { FullDepartureFilter } from "./departure-filter";
import { filterToApiString } from "./departure-filter-encoding";
import { callApi } from "../utils/api-call";
import { dateTimeZodSchema } from "../utils/time-utils";

/** Zod parser for the departures API response. */
export const ApiResponseJson = z.object({
  departures: z.object({
    stop: stopIDZodSchema,
    timeUTC: dateTimeZodSchema,
    line: lineIDZodSchema,
    service: z.string(),
    direction: directionIDZodSchema,
    platform: platformIDZodSchema.nullable(),
    setDownOnly: z.boolean(),
    stops: z.object({
      stop: stopIDZodSchema,
      timeUTC: dateTimeZodSchema
    }).array()
  }).array().array()
});

/** Represents a single departure from a particular stop. */
export type Departure =
  z.infer<typeof ApiResponseJson.shape.departures.element.element>;

/** A feed of departures. */
export class Feed {
  /** The stop to get departures for. */
  readonly stop: StopID;

  /** How many departures are desired. */
  readonly count: number;

  /** The filter to use. */
  readonly filter: FullDepartureFilter;

  /**
   * Creates a {@link Feed}.
   * @param stop The stop to get departures for.
   * @param count How many departures are desired.
   * @param filter The filter to use.
   */
  constructor(stop: StopID, count: number, filter: FullDepartureFilter) {
    this.stop = stop;
    this.count = count;
    this.filter = filter;
  }

  /** Converts the feed to JSON. */
  toJSON(): object {
    return {
      stop: this.stop,
      count: this.count,
      filter: filterToApiString(this.filter) ?? undefined
    };
  }
}

/**
 * Returns multiple lists of departures from the API. The order of the lists
 * will match the given feeds order. Throws errors if the API doesn't respond,
 * or responds in an unrecognized format.
 * @param origin The API origin, e.g. "https://api.trainquery.com".
 * @param time The time to get departures after.
 * @param reverse True to return departures before the given time.
 * @param feeds The feeds of departures to request.
 */
export async function fetchDepartures(origin: string, time: DateTime,
  reverse: boolean, feeds: Feed[]): Promise<Departure[][]> {

  const feedsJson = JSON.stringify(feeds.map(f => f.toJSON()));
  const feedsBase64String = encodeURI(feedsJson);

  const response = await callApi(origin, "departures/v2", {
    time: time.toISO(),
    reverse: reverse ? "true" : "false",
    feeds: feedsBase64String
  }, ApiResponseJson);

  return response.departures;
}
