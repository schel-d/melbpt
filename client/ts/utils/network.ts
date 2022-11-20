import { DateTime } from "luxon";
import { TransitNetwork } from "melbpt-utils";
import { callApiNoHash } from "./api-call";

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
 * Singleton object that stores the network information once loaded from local
 * storage or downloaded from the API.
 */
let network: TransitNetwork | null = null;

/**
 * Singleton object that stores the current download promise. This way if
 * multiple sections of code call initNetwork() at the same time, only one
 * download will begin, and when it completes every initNetwork() promise will
 * resolve with that single download, as opposed to downloading it multiple
 * times separately.
 */
let downloadInProgress: Promise<TransitNetwork> | null = null;

/**
 * Returns the network information, either by returning the singleton variable
 * if already loaded, retrieving it from local storage if not (and the data
 * isn't stale), or downloading it from the API if its stale or the website's
 * never been visited before.
 */
export async function initNetwork(apiOrigin: string): Promise<TransitNetwork> {
  if (network != null) {
    return network;
  }

  const localStorageNetwork = retrieveFromLocalStorage();
  if (localStorageNetwork != null) {
    network = localStorageNetwork;
    return network;
  }

  // If there's not already a downloadInProgress promise running...
  if (downloadInProgress == null) {
    const download = async () =>
      callApiNoHash(apiOrigin, "network/v1", {}, TransitNetwork.json);

    // Start the download and save the promise in case there are future calls
    // to this method.
    downloadInProgress = download();
    downloadInProgress
      .then(network => {
        updateNetwork(network);
      })
      .catch(() => {
        // Do nothing, because whoever called initNetwork() will get the same
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
 * Returns the previously loaded/updated network information. Throws an error if
 * {@link initNetwork} has not been called yet for this page.
 */
export function getNetwork(): TransitNetwork {
  if (network == null) {
    throw new Error(
      "Network was null. initNetwork() should be called before the page is " +
      "initialized."
    );
  }
  return network;
}

/**
 * Takes new network information (likely returned from an API call) and updates
 * the network singleton and local storage cache. Future calls to getNetwork()
 * will now return this value.
 * @param updatedNetwork The updated network information.
 */
export function updateNetwork(updatedNetwork: TransitNetwork) {
  network = updatedNetwork;
  cacheNetwork(updatedNetwork);
}

/**
 * Returns the network object stored in the browsers local storage if available.
 * Returns null if unavailable or any unexpected error occurs.
 */
function retrieveFromLocalStorage(): TransitNetwork | null {
  const ageStr = window.localStorage.getItem(networkAgeLSKey);
  if (ageStr == null) {
    return null;
  }

  const age = DateTime.fromISO(ageStr);
  if (!age.isValid) {
    return null;
  }

  if (age.diffNow().as("days") < -daysToCacheNetwork) {
    return null;
  }

  const cachedNetworkStr = window.localStorage.getItem(networkLSKey);
  if (cachedNetworkStr == null) {
    return null;
  }

  try {
    const cachedNetworkJson = JSON.parse(cachedNetworkStr);
    const cachedNetwork = TransitNetwork.json.parse(cachedNetworkJson);
    network = cachedNetwork;
    return network;
  }
  catch {
    return null;
  }
}

/**
 * Write the provided network object to local storage, which is used to cache
 * it.
 * @param network The network data to cache.
 */
function cacheNetwork(network: TransitNetwork) {
  window.localStorage.setItem(networkLSKey, JSON.stringify(network.toJSON()));
  window.localStorage.setItem(networkAgeLSKey, DateTime.utc().toISO());
}
