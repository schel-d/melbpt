import { lineIDZodSchema, TransitNetwork } from "melbpt-utils";
import { z } from "zod";
import { getNetwork, updateNetwork } from "../../utils/network";
import { dateTimeZodSchema } from "../../utils/time-utils";

/**
 * The URL of the API to request the timetables data from.
 */
const apiUrl = window.apiOrigin + "/timetables/v1";

/**
 * Zod parser for a list of available timetables returned from the API.
 */
export const TimetablesJson = z.object({
  line: lineIDZodSchema,
  lastUpdated: dateTimeZodSchema
}).array();

/**
 * Zod parser for the available timetables API response.
 */
export const ApiResponseJson = z.object({
  timetables: TimetablesJson,
  network: TransitNetwork.json.nullable()
});

/**
 * Represents a list of available timetables.
 */
export type Timetables = z.infer<typeof TimetablesJson>;

export async function fetchAvailableTimetables(): Promise<Timetables> {
  // Build the URL for the get request.
  const fetchUrl = new URL(apiUrl);
  fetchUrl.searchParams.append("hash", getNetwork().hash);

  // Query the API.
  const responseHeader = await fetch(fetchUrl.href);

  // Read the json from the API and parse it.
  const responseJson = await responseHeader.json();
  const response = ApiResponseJson.parse(responseJson);

  // If the response included a network, it's because the cached one is
  // outdated, so update it.
  if (response.network != null) {
    updateNetwork(response.network);
  }

  return response.timetables;
}
