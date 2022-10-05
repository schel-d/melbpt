import { z } from "zod";
import { NetworkJson, getNetwork, updateNetwork } from "../../utils/network";
import { parseDateTime } from "../../utils/network-utils";

/**
 * The URL of the API to request the service data from.
 */
const apiUrl = window.apiDomain + "/service/v1";

/**
 * Zod parser for a single stop in the service data returned from the API.
 */
export const ServiceStopJson = z.object({
  stop: z.number().int(),
  timeUTC: parseDateTime,
  platform: z.string().nullable(),
  setDownOnly: z.boolean()
});

/**
 * Zod parser for the service data returned from the API.
 */
export const ServiceJson = z.object({
  id: z.string(),
  line: z.number().int(),
  direction: z.string(),
  timetabledDayOfWeek: z.string(),
  stops: ServiceStopJson.array()
});

/**
 * Zod parser for the service API response.
 */
export const ApiResponseJson = z.object({
  service: ServiceJson,
  network: NetworkJson.nullable()
});

/**
 * Represents a single stop in a service.
 */
export type ServiceStop = z.infer<typeof ServiceStopJson>;

/**
 * Represents a service.
 */
export type Service = z.infer<typeof ServiceJson>;

/**
 * The departures API response.
 */
export type ApiResponse = z.infer<typeof ApiResponseJson>;

/**
 * Returns the service data from the API. Throws errors if the API doesn't
 * respond, or responds in an unrecognized format.
 * @param serviceID The ID of the service.
 */
export async function fetchService(serviceID: string): Promise<Service | null> {
  // Build the URL for the get request.
  const fetchUrl = new URL(apiUrl);
  fetchUrl.searchParams.append("id", serviceID);
  fetchUrl.searchParams.append("hash", getNetwork().hash);

  // Query the API.
  const responseHeader = await fetch(fetchUrl.href);

  // If the train id is invalid, then the server will give error code 400.
  if (responseHeader.status == 400) {
    return null;
  }

  // Read the json from the API and parse it.
  const responseJson = await responseHeader.json();
  const response = ApiResponseJson.parse(responseJson);

  // If the response included a network, it's because the cached one is
  // outdated, so update it.
  if (response.network != null) {
    updateNetwork(response.network);
  }

  return response.service;
}
