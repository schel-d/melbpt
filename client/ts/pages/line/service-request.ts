import { LineGraph, LineID, TransitNetwork } from "melbpt-utils";
import { z } from "zod";
import { getNetwork, updateNetwork } from "../../utils/network";

/**
 * The URL of the API to request the service data from.
 */
const apiUrl = window.apiDomain + "/line-details/v1";

export const DetailsJson = z.object({
  lineGraph: LineGraph.json
});

export type Details = z.infer<typeof DetailsJson>;

/**
 * Zod parser for the service API response.
 */
export const ApiResponseJson = z.object({
  details: DetailsJson,
  network: TransitNetwork.json.nullable()
});

/**

/**
 * Returns the line details from the API. Throws errors if the API doesn't
 * respond, or responds in an unrecognized format.
 * @param lineID The ID of the line.
 */
export async function fetchDetails(lineID: LineID): Promise<Details | null> {
  // Build the URL for the get request.
  const fetchUrl = new URL(apiUrl);
  fetchUrl.searchParams.append("id", lineID.toFixed());
  fetchUrl.searchParams.append("hash", getNetwork().hash);

  // Query the API.
  const responseHeader = await fetch(fetchUrl.href);

  // If the line id is invalid, then the server will give error code 400.
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

  return response.details;
}
