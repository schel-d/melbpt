import { DateTime } from "luxon";
import {
  directionIDZodSchema, lineIDZodSchema, platformIDZodSchema, stopIDZodSchema,
} from "melbpt-utils";
import { z } from "zod";
import { callApi } from "../../utils/api-call";
import { dateTimeZodSchema } from "../../utils/time-utils";

/**
 * Zod parser for the departures API response.
 */
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

/**
 * Represents a single departure from a particular stop.
 */
export type Departure =
  z.infer<typeof ApiResponseJson.shape.departures.element.element>;

/**
 * Returns a list of departures from the API. Throws errors if the API doesn't
 * respond, or responds in an unrecognized format.
 * @param stopID The stop the departures should depart from.
 * @param time The time to get departures after.
 * @param count How many departures to ask for.
 * @param reverse True to return departures before the given time.
 * @param filters The filter strings for the departures API, e.g. "up narr nsdo".
 */
export async function fetchDepartures(origin: string, stopID: number, time: DateTime,
  count: number, reverse: boolean, filters: string[]): Promise<Departure[][]> {

  const filtersRecord = filters.reduce(
    (acc, item, i) => {
      acc[`filter-${i.toFixed()}`] = item;
      return acc;
    },
    {} as Record<string, string>
  );

  const response = await callApi(origin, "batch-departures/v1", {
    stop: stopID.toFixed(),
    time: time.toISO(),
    count: count.toFixed(),
    reverse: reverse ? "true" : "false",
    ...filtersRecord
  }, ApiResponseJson);

  return response.departures;
}
