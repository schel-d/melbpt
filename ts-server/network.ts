import got from "got";
import { TransitNetwork } from "melbpt-utils";

/**
 * How often (in milliseconds) to re-download the network data from the api.
 * Currently set to the value of every 10 minutes.
 */
const dataRefreshIntervalMs = 10 * 60 * 1000;

/**
 * The URL of the network API.
 */
const apiPath = "/network/v1";

/**
 * Network singleton.
 */
let network: TransitNetwork | null = null;

/**
 * Downloads the network information for the API server and makes it available
 * to anyone calling {@link getNetwork}. Also begins an interval which refreshes
 * the network data regularly. Throws an error if the first download of network
 * data fails, but if later updates to the data fail the function will log the
 * error and keep using the old version of the data.
 * @param apiOrigin The origin of the API server, e.g.
 * "https://api.trainquery.com".
 */
export async function initNetwork(apiOrigin: string, reservedRoutes: string[]) {
  const incoming = await fetchNetwork(apiOrigin);

  const firstTime = network == null;

  // Check the incoming network information to make sure no reserved routes are
  // being used by the stops custom url, e.g. no stop can have url "/js".
  const stopUrls = incoming.stops.map(s => `/${s.urlName}`);
  const badRoute = reservedRoutes.find(r => stopUrls.includes(r));
  if (badRoute != null) {
    const msg = `The route ${badRoute} wasn't not being reserved correctly.`;
    throw new Error(msg);
  }

  // Set the global variables (note that this only happens if there's no route
  // clashes).
  network = incoming;

  if (firstTime) {
    console.log(`Fetched data (network hash="${network.hash}").`);

    // Every 30 minutes re-download the data from the api to stay up to date.
    // If an error occurs, continue using the previous version of the data,
    // and try again in another 30 minutes.
    setInterval(async () => {
      try {
        await initNetwork(apiOrigin, reservedRoutes);
      }
      catch (ex) {
        // If an error occurs, just log it. The variable will still contain
        // the old data, so no need to touch it.
        console.log(`Error refreshing data (will continue using old data).`, ex);
      }
    }, dataRefreshIntervalMs);
  }
  else {
    console.log(`Refreshed data (network hash="${network.hash}").`);
  }
}

/**
 * Gets the up-to-date network information.
 */
export function getNetwork(): TransitNetwork {
  if (network != null) {
    return network;
  }
  throw new Error("Network not available yet - Call initNetwork() first");
}

/**
 * Downloads and returns the network object from the API server. Throws an error
 * if something goes wrong.
 */
async function fetchNetwork(apiOrigin: string): Promise<TransitNetwork> {
  const json = await got.get(apiOrigin + apiPath).json();
  const network = TransitNetwork.json.parse(json);
  return network;
}
