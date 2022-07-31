import { DateTime } from "luxon";
import { z } from "zod";

/**
 * The URL of the network API.
 */
const apiUrl = "https://api.trainquery.com/network/v1";

/**
 * The key in local storage for the cached network information.
 */
const networkLSKey = "melbpt-network";

/**
 * The key in local storage for the age of the cached network information.
 */
const networkAgeLSKey = "melbpt-network-age";

/**
 * The number of days to keep reusing the cached data until it is considered too
 * stale.
 */
const daysToCacheNetwork = 7;

/**
 * The Zod schema to parse the json for each stop in the network.
 */
const StopJson = z.object({
  id: z.number().int(),
  name: z.string(),
  platforms: z.object({
    id: z.string(),
    name: z.string()
  }).array(),
  urlName: z.string()
});

/**
 * The Zod schema to parse the json for each line in the network.
 */
const LineJson = z.object({
  id: z.number().int(),
  name: z.string(),
  color: z.enum(["red", "yellow", "green", "cyan", "blue", "purple", "pink", "grey"]),
  service: z.enum(["suburban", "regional"]),
  routeType: z.enum(["linear", "city-loop", "branch"]),
  routeLoopPortal: z.enum(["richmond", "jolimont", "north-melbourne"]).optional(),

  directions: z.object({
    id: z.string(),
    name: z.string(),
    stops: z.number().int().array()
  }).array()
});

/**
 * The Zod schema to parse the network json returned from the API.
 */
const NetworkJson = z.object({
  hash: z.string(),
  stops: StopJson.array(),
  lines: LineJson.array(),
});

/**
 * Data associated with the lines and stops in the network.
 */
export type Network = z.infer<typeof NetworkJson>;

/**
 * Data associated with a particular stop in the network.
 */
export type Stop = z.infer<typeof StopJson>;

/**
 * Data associated with a particular line in the network.
 */
export type Line = z.infer<typeof LineJson>;

/**
 * Singleton object that stores the network information once loaded from local
 * storage or downloaded from the API.
 */
let network: Network | null = null;

/**
 * Singleton object that stores the current download promise. This way if
 * multiple sections of code call getNetwork() at the same time, only one
 * download will begin, and when it completes every getNetwork() promise will
 * resolve with that single download, as opposed to downloading it multiple
 * times separately.
 */
let downloadInProgress: Promise<Network> | null = null;

/**
 * Returns the network information, either by returning the singleton variable
 * if already loaded, retrieving it from local storage if not (and the data
 * isn't stale), or downloading it from the API if its stale or the website's
 * never been visited before.
 */
export async function getNetwork(): Promise<Network> {
  if (network != null) {
    return network;
  }

  const localStorageNetwork = retrieveFromLocalStorage();
  if (localStorageNetwork != null) {
    network = localStorageNetwork;
    return network;
  }

  if (downloadInProgress == null) {
    // Only start downloading it if we're not already.
    downloadInProgress = download();
    downloadInProgress
      .then(network => {
        window.localStorage.setItem(networkLSKey, JSON.stringify(network));
        window.localStorage.setItem(networkAgeLSKey, DateTime.utc().toISO());
      })
      .catch(() => {
        // Do nothing, because whoever called getNetwork() will get the same
        // errors passed to them anyway, so they can deal with them there.
      })
      .finally(() => {
        // Whether it is successful or not, this promise has run its course, so
        // delete it.
        downloadInProgress = null;
      });
  }

  // Await the common download regardless of whether this specific call started
  // it or not.
  return await downloadInProgress;
}

/**
 * Returns the network object stored in the browsers local storage if available.
 * Returns null if unavailable or any unexpected error occurs (error is logged).
 */
function retrieveFromLocalStorage(): Network | null {
  const ageStr = window.localStorage.getItem(networkAgeLSKey);
  if (ageStr == null) {
    return null;
  }

  const age = DateTime.fromISO(ageStr);
  if (!age.isValid) {
    console.error("Cached network in browser's local storage had an invalid age.");
    return null;
  }

  if (age.diffNow().as("days") < -daysToCacheNetwork) {
    return null;
  }

  const cachedNetworkStr = window.localStorage.getItem(networkLSKey);
  if (cachedNetworkStr == null) {
    console.error("Cached network was in an invalid format.");
    return null;
  }

  try {
    const cachedNetworkJson = JSON.parse(cachedNetworkStr);
    const cachedNetwork = NetworkJson.parse(cachedNetworkJson);
    network = cachedNetwork;
    return network;
  }
  catch {
    console.error("Cached network was in an invalid format.");
    return null;
  }
}

/**
 * Returns the network object after downloading it from the API. Throws errors
 * if the API doesn't respond, or responds in an unexpected format.
 */
async function download(): Promise<Network> {
  const response = await fetch(apiUrl);
  if (response.status != 200) {
    throw new Error("The API did not respond.");
  }

  try {
    const json = await response.json();
    const apiResponse = NetworkJson.parse(json);
    return apiResponse;
  }
  catch {
    throw new Error("The API responded in an unexpected format.");
  }
}
