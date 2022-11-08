import got from "got";
import { TransitNetwork } from "melbpt-utils";

/**
 * The URL of the network API.
 */
const apiPath = "/network/v1";

/**
 * Downloads and returns the network object from the server. Throws an error
 * if something goes wrong.
 */
export async function fetchNetwork(apiDomain: string): Promise<TransitNetwork> {
  const json = await got.get(apiDomain + apiPath).json();
  const network = TransitNetwork.json.parse(json);
  return network;
}
