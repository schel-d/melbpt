import { z } from "zod";
import { getNetworkFromCache, Network, NetworkJson } from "../network";
import { parseDateTime } from "../network-utils";

/**
 * The URL of the API to request the service data from.
 */
const apiUrl = "https://api.trainquery.com/service/v1";

/**
 * Zod parser for the service data returned from the API.
 */
export const ServiceJson = z.object({
  id: z.string(),
  line: z.number().int(),
  direction: z.string(),
  timetabledDayOfWeek: z.string(),
  stops: z.object({
    stop: z.number().int(),
    timeUTC: parseDateTime,
    platform: z.string().nullable(),
    setDownOnly: z.boolean()
  }).array()
});

/**
 * Zod parser for the departures API response.
 */
export const ApiResponseJson = z.object({
  service: ServiceJson,
  network: NetworkJson.nullable()
});

/**
 * Represents a single departure from a particular stop.
 */
export type Service = z.infer<typeof ServiceJson>;

/**
 * The departures API response.
 */
export type ApiResponse = z.infer<typeof ApiResponseJson>;

/**
 * What the {@link fetchDepartures} function actually returns. Note that network
 * is non-null.
 */
type ReturnValue = {
  service: Service,
  network: Network
};

/**
 * Returns the service data from the API. Throws errors if the API doesn't
 * respond, or responds in an unrecognized format.
 * @param serviceID The ID of the service.
 */
export async function fetchService(serviceID: string): Promise<ReturnValue | null> {
  // Build the URL for the get request.
  const fetchUrl = new URL(apiUrl);
  fetchUrl.searchParams.append("id", serviceID);
  fetchUrl.searchParams.append("hash", getNetworkFromCache()?.hash ?? "null");

  // Query the API.
  const responseHeader = await fetch(fetchUrl.href);

  // If the train id is invalid, then the server will give error code 400.
  if (responseHeader.status == 400) {
    return null;
  }

  // Read the json from the API and parse it.
  const responseJson = await responseHeader.json();
  const response = ApiResponseJson.parse(responseJson);

  // If the cached network data was stale, then a fresh one will be provided by
  // the API, so use it if available. If ours was up-to-date, the API will have
  // null in the network field.
  const network: Network | null = response.network ?? getNetworkFromCache();
  if (network == null) { throw new Error(); }

  // Todo: Cache the fresh network data (if the API provided some).

  return {
    service: response.service,
    network: network
  };
}
