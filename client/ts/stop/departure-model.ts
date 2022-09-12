import { DateTime } from "luxon"
import { Line, Network, Stop } from "../network";
import { Departure } from "./departure-request";
import { getStopName } from "../network-utils";
import { flagstaff, flindersStreet, melbourneCentral, parliament } from "../special-ids";

/**
 * Represents explicitly only the data shown on a departure's UI, so that it can
 * be compared when new data is available.
 */
export class DepartureModel {
  serviceUrl: string;
  color: string;

  terminus: string;
  timeUTC: DateTime;
  platform: string | null;
  line: string;

  stoppingPattern: string;
  stoppingPatternIcon: "stops-all" | "express" | "not-taking-passengers" | "arrival";

  /**
   * Creates a departure model from a departure.
   * @param departure The departure.
   * @param stop The stop the departure departs from.
   * @param network The network object.
   */
  constructor(departure: Departure, stop: Stop, network: Network) {
    // Work out the url for the service (when departure is clicked).
    const serviceUrl = new URL("/train", document.location.origin);
    serviceUrl.searchParams.append("id", departure.service);
    serviceUrl.searchParams.append("from", stop.id.toFixed());
    this.serviceUrl = serviceUrl.href;

    // Work out the line name and color.
    const line = network.lines.find(l => l.id == departure.line);
    if (line == null) { throw new Error(`Line "${line}" not found.`); }
    this.color = line.color;
    this.line = line.name;

    // Work out the terminus name.
    const terminusStopID = departure.stops[departure.stops.length - 1].stop;
    this.terminus = getStopName(network, terminusStopID);

    // Store time as simply time, since the live time odometer bases it's value
    // off this too.
    this.timeUTC = departure.timeUTC;

    // Work out the platform name (if appropriate).
    if (departure.platform != null) {
      const platform = stop.platforms.find(p => p.id == departure.platform);
      if (platform == null) {
        throw new Error(`Platform "${departure.platform}" not found.`);
      }
      this.platform = platform.name;
    }
    else {
      this.platform = null;
    }

    if (departure.setDownOnly) {
      this.stoppingPattern = "Not taking passengers";
      this.stoppingPatternIcon = "not-taking-passengers";
    }
    else {
      const pattern = determineStoppingPattern(departure, stop, network, line);
      this.stoppingPattern = pattern.string;
      this.stoppingPatternIcon = pattern.icon;
    }

  }

  /**
   * Returns whether or not the departure model is equivalent.
   * @param other The other departure model to compare.
   */
  equals(other: DepartureModel): boolean {
    return this.serviceUrl === other.serviceUrl
      && this.color === other.color
      && this.terminus === other.terminus
      && this.timeUTC.equals(other.timeUTC)
      && this.platform === other.platform
      && this.line === other.line;
  }
}

/**
 * Returns the string to use for the stopping pattern, assuming the service
 * isn't set down only.
 * @param departure The departure info.
 * @param stop The stop of the station the passenger is waiting at.
 * @param network The network information (stop names).
 * @param line The line information of the service.
 */
function determineStoppingPattern(departure: Departure, stop: Stop,
  network: Network, line: Line): {
    string: string,
    icon: "stops-all" | "express" | "not-taking-passengers" | "arrival"
  } {

  // Get the future stops on this service (list of stop IDs).
  const stopsAfterNow = departure.stops
    .map(s => s.stop)
    .slice(departure.stops.findIndex(s => s.stop == stop.id) + 1);

  // If there are no stops in the future, it must be an arrival.
  if (stopsAfterNow.length == 0) {
    return {
      string: `Arrival - Not taking passengers`,
      icon: "arrival"
    };
  }

  // If there's only one more stop, I guess it's express lol.
  if (stopsAfterNow.length == 1) {
    return {
      string: `Stops at ${getStopName(network, stopsAfterNow[0])} only`,
      icon: "express"
    };
  }

  const terminus = stopsAfterNow[stopsAfterNow.length - 1];

  // Get the future stops on this line (list of stop IDs).
  const direction = line.directions.find(d => d.id == departure.direction);
  if (direction == null) { throw new Error("Couldn't find direction."); }
  const stopsAfterNowOnLine = direction.stops
    .slice(direction.stops.indexOf(stop.id) + 1, direction.stops.indexOf(terminus) + 1);

  // Get a map of future stops on line with true or false of whether they are
  // serviced.
  const futureStops = stopsAfterNowOnLine.map(s => {
    return { stop: s, stopped: stopsAfterNow.includes(s) };
  });

  // If every stop is serviced, then it stops all stations.
  if (futureStops.every(s => s.stopped)) {
    const viaLoop = stopsAfterNow.includes(flagstaff)
      || stopsAfterNow.includes(melbourneCentral)
      || stopsAfterNow.includes(parliament);

    if (viaLoop) {
      return {
        string: `Stops all stations via city loop`,
        icon: "stops-all"
      };
    }
    if (terminus == flindersStreet && !viaLoop) {
      return {
        string: `Stops all stations direct to ${getStopName(network, flindersStreet)}`,
        icon: "stops-all"
      };
    }
    return {
      string: `Stops all stations`,
      icon: "stops-all"
    };
  }

  // If 4 or less stations are skipped, just list them, unless listing the stops
  // it DOES stop at is still shorter.
  const stopped = futureStops.filter(s => s.stopped).map(s => s.stop);
  const skipped = futureStops.filter(s => !s.stopped).map(s => s.stop);
  if (skipped.length <= 4 && stopped.length > skipped.length) {
    return {
      string: `Skips ${skipped.map(s => getStopName(network, s)).join(", ")}`,
      icon: skipped.length > stopped.length * 0.3 ? "express" : "stops-all"
    };
  }

  // Otherwise just list every station it stops at.
  return {
    string: `Stops at ${stopped.map(s => getStopName(network, s)).join(", ")}`,
    icon: skipped.length > stopped.length * 0.3 ? "express" : "stops-all"
  };
}
