import { DateTime } from "luxon";
import { z } from "zod";
import { getNetworkFromCache, Network, NetworkJson } from "../network";
import { parseDateTime } from "../network-utils";

/**
 * The URL of the API to request the departures from.
 */
const apiUrl = "https://api.trainquery.com/batch-departures/v1";

/**
 * Zod parser for a single departure in the array returned from the departures
 * API.
 */
export const DepartureJson = z.object({
  stop: z.number().int(),
  timeUTC: parseDateTime,
  line: z.number().int(),
  service: z.string(),
  direction: z.string(),
  platform: z.string().nullable(),
  setDownOnly: z.boolean(),
  stops: z.object({
    stop: z.number().int(),
    timeUTC: parseDateTime
  }).array()
});

/**
 * Zod parser for the departures API response.
 */
export const ApiResponseJson = z.object({
  departures: DepartureJson.array().array(),
  network: NetworkJson.nullable()
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
 * What the {@link fetchDepartures} function actually returns. Note that network
 * is non-null.
 */
type ReturnValue = {
  departures: Departure[][],
  network: Network
};

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
  count: number, reverse: boolean, filters: string[]): Promise<ReturnValue> {

  // Build the URL for the get request.
  const fetchUrl = new URL(apiUrl);
  fetchUrl.searchParams.append("stop", stopID.toFixed());
  fetchUrl.searchParams.append("time", time.toISO());
  fetchUrl.searchParams.append("count", count.toFixed());
  fetchUrl.searchParams.append("reverse", reverse ? "true" : "false");
  fetchUrl.searchParams.append("hash", getNetworkFromCache()?.hash ?? "null");
  filters.forEach((f, i) => fetchUrl.searchParams.append(`filter-${i.toFixed()}`, f));


  // Fetch the json from the url and parse it.
  const responseJson = await (await fetch(fetchUrl.href)).json();
  const response = ApiResponseJson.parse(responseJson);

  // If the cached network data was stale, then a fresh one will be provided by
  // the API, so use it if available. If ours was up-to-date, the API will have
  // null in the network field.
  const network: Network | null = response.network ?? getNetworkFromCache();
  if (network == null) { throw new Error(); }

  // Todo: Cache the fresh network data (if the API provided some).

  return {
    departures: response.departures,
    network: network
  };
}
