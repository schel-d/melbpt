import { DateTime } from "luxon";
import {
  directionIDZodSchema, lineIDZodSchema, platformIDZodSchema, stopIDZodSchema,
  TransitNetwork
} from "melbpt-utils";
import { z } from "zod";
import { getNetwork, updateNetwork } from "../../utils/network";
import { dateTimeZodSchema } from "../../utils/time-utils";

/**
 * The URL of the API to request the departures from.
 */
const apiUrl = window.apiOrigin + "/batch-departures/v1";

/**
 * Zod parser for a single departure in the array returned from the departures
 * API.
 */
export const DepartureJson = z.object({
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
});

/**
 * Zod parser for the departures API response.
 */
export const ApiResponseJson = z.object({
  departures: DepartureJson.array().array(),
  network: TransitNetwork.json.nullable()
});

/**
 * Represents a single departure from a particular stop.
 */
export type Departure = z.infer<typeof DepartureJson>;

/**
 * The departures API response.
 */
export type ApiResponse = z.infer<typeof ApiResponseJson>;

/**
 * Returns a list of departures from the API. Throws errors if the API doesn't
 * respond, or responds in an unrecognized format.
 * @param stopID The stop the departures should depart from.
 * @param time The time to get departures after.
 * @param count How many departures to ask for.
 * @param reverse True to return departures before the given time.
 * @param filters The filter strings for the departures API, e.g. "up narr nsdo".
 */
export async function fetchDepartures(stopID: number, time: DateTime,
  count: number, reverse: boolean, filters: string[]): Promise<Departure[][]> {

  // Build the URL for the get request.
  const fetchUrl = new URL(apiUrl);
  fetchUrl.searchParams.append("stop", stopID.toFixed());
  fetchUrl.searchParams.append("time", time.toISO());
  fetchUrl.searchParams.append("count", count.toFixed());
  fetchUrl.searchParams.append("reverse", reverse ? "true" : "false");
  fetchUrl.searchParams.append("hash", getNetwork().hash);
  filters.forEach((f, i) => fetchUrl.searchParams.append(`filter-${i.toFixed()}`, f));

  // Fetch the json from the url and parse it.
  const responseJson = await (await fetch(fetchUrl.href)).json();
  const response = ApiResponseJson.parse(responseJson);

  // If the response included a network, it's because the cached one is
  // outdated, so update it.
  if (response.network != null) {
    updateNetwork(response.network);
  }

  return response.departures;
}
