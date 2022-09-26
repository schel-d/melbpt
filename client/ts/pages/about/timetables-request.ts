import { z } from "zod";
import { getNetworkFromCache, Network, NetworkJson, cacheNetwork }
  from "../../utils/network";
import { parseDateTime } from "../../utils/network-utils";

/**
 * The URL of the API to request the timetables data from.
 */
const apiUrl = window.apiDomain + "/timetables/v1";

/**
 * Zod parser for a list of available timetables returned from the API.
 */
export const TimetablesJson = z.object({
  line: z.number().int(),
  lastUpdated: parseDateTime
}).array();

/**
 * Zod parser for the available timetables API response.
 */
export const ApiResponseJson = z.object({
  timetables: TimetablesJson,
  network: NetworkJson.nullable()
});

/**
 * Represents a list of available timetables.
 */
export type Timetables = z.infer<typeof TimetablesJson>;

/**
 * What the {@link fetchAvailableTimetables} function actually returns. Note
 * that network is non-null.
 */
type ReturnValue = {
  timetables: Timetables,
  network: Network
};

export async function fetchAvailableTimetables(): Promise<ReturnValue> {
  // Build the URL for the get request.
  const fetchUrl = new URL(apiUrl);
  fetchUrl.searchParams.append("hash", getNetworkFromCache()?.hash ?? "null");

  // Query the API.
  const responseHeader = await fetch(fetchUrl.href);

  // Read the json from the API and parse it.
  const responseJson = await responseHeader.json();
  const response = ApiResponseJson.parse(responseJson);

  // If the cached network data was stale, then a fresh one will be provided by
  // the API, so use it if available. If ours was up-to-date, the API will have
  // null in the network field.
  const network: Network | null = response.network ?? getNetworkFromCache();
  if (network == null) { throw new Error(); }

  // If the response included a network, it's because the cached one is
  // outdated, so update it.
  if (response.network != null) {
    cacheNetwork(network);
  }

  return {
    timetables: response.timetables,
    network: network
  };
}
