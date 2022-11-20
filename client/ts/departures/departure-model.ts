import { DateTime } from "luxon";
import { Departure } from "./departure-request";
import { flagstaff, flindersStreet, melbourneCentral, parliament }
  from "../utils/special-ids";
import { getNetwork } from "../utils/network";
import { Line, Stop, StopID } from "melbpt-utils";

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
   */
  constructor(departure: Departure, stop: Stop) {
    // Work out the url for the service (when departure is clicked).
    const serviceUrl = new URL("/train", document.location.origin);
    serviceUrl.searchParams.append("id", departure.service);
    serviceUrl.searchParams.append("from", stop.id.toFixed());
    this.serviceUrl = serviceUrl.href;

    // Work out the line name and color.
    const line = getNetwork().requireLine(departure.line);
    this.color = line.color;
    this.line = line.name;

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

    const pattern = determineStoppingPattern(departure, stop, line);
    this.stoppingPattern = pattern.string;
    this.stoppingPatternIcon = pattern.icon;

    // Work out the terminus name. Append "via loop" if appropriate.
    const terminusStopID = departure.stops[departure.stops.length - 1].stop;
    const terminusName = getNetwork().requireStop(terminusStopID).name;
    this.terminus = pattern.viaLoop ? `${terminusName} via loop` : terminusName;
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
 * @param line The line information of the service.
 */
function determineStoppingPattern(departure: Departure, stop: Stop, line: Line): {
  string: string,
  icon: "stops-all" | "express" | "not-taking-passengers" | "arrival",
  viaLoop: boolean
} {

  const stopName = (x: StopID) => getNetwork().requireStop(x).name;

  // Get the future stops on this service (list of stop IDs).
  const stopsAfterNow = departure.stops
    .map(s => s.stop)
    .slice(departure.stops.findIndex(s => s.stop == stop.id) + 1);

  // Determine whether this service stops in the city loop in the future. Only
  // true if it stops at all the underground stations, since there's no point
  // saying "via city loop" if you're already at Melbourne Central.
  const viaLoop = [flagstaff, melbourneCentral, parliament]
    .every(s => stopsAfterNow.includes(s));

  // If there are no stops in the future, it must be an arrival.
  if (stopsAfterNow.length == 0) {
    const originName = stopName(departure.stops[0].stop);
    return {
      string: `Arrival from ${originName} - Not taking passengers`,
      icon: "arrival",
      viaLoop: viaLoop
    };
  }

  if (departure.setDownOnly) {
    return {
      string: "Not taking passengers",
      icon: "not-taking-passengers",
      viaLoop: viaLoop
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
  const stopped = futureStops.filter(s => s.stopped).map(s => s.stop);
  const skipped = futureStops.filter(s => !s.stopped).map(s => s.stop);
  const expressIcon = skipped.length > stopped.length * 0.3;

  // If there's only one more stop, I guess it's express lol.
  if (futureStops.length == 1) {
    return {
      string: `Stops at ${stopName(stopsAfterNow[0])} only`,
      icon: expressIcon ? "express" : "stops-all",
      viaLoop: viaLoop
    };
  }

  // If every stop is serviced, then it stops all stations.
  if (futureStops.every(s => s.stopped)) {
    if (viaLoop) {
      return {
        string: `Stops all stations via city loop`,
        icon: "stops-all",
        viaLoop: viaLoop
      };
    }
    if (terminus == flindersStreet && !viaLoop) {
      return {
        string: `Stops all stations direct to ${stopName(flindersStreet)}`,
        icon: "stops-all",
        viaLoop: viaLoop
      };
    }
    return {
      string: `Stops all stations`,
      icon: "stops-all",
      viaLoop: viaLoop
    };
  }

  if (skipped.length > 2) {
    const expressStart = futureStops.findIndex(s => !s.stopped);
    const expressEndReversed = [...futureStops].reverse().findIndex(s => !s.stopped);
    const expressEnd = futureStops.length - 1 - expressEndReversed;
    const expressEndStopID = futureStops[expressEnd + 1].stop;
    const expressEndStopName = stopName(expressEndStopID);

    const expressRun = futureStops.slice(expressStart, expressEnd);
    const stopsInBetween = expressRun
      .filter(s => s.stopped)
      .map(s => stopName(s.stop));

    const expressStartStopID = expressStart == 0
      ? stop.id
      : futureStops[expressStart - 1].stop;
    const expressStartStopName = stopName(expressStartStopID);

    if (stopsInBetween.length == 0) {
      return {
        string: `Express ${expressStartStopName} > ${expressEndStopName}`,
        icon: expressIcon ? "express" : "stops-all",
        viaLoop: viaLoop
      };
    }
    else if (stopsInBetween.length == 1) {
      return {
        string: `Express ${expressStartStopName} > ${stopsInBetween[0]}`
          + ` > ${expressEndStopName}`,
        icon: expressIcon ? "express" : "stops-all",
        viaLoop: viaLoop
      };
    }
    else if (stopsInBetween.length == 2) {
      return {
        string: `Express ${expressStartStopName} > ${stopsInBetween[0]}`
          + ` > ${stopsInBetween[1]} > ${expressEndStopName}`,
        icon: expressIcon ? "express" : "stops-all",
        viaLoop: viaLoop
      };
    }
  }

  // If 4 or less stations are skipped, just list them, unless listing the stops
  // it DOES stop at is still shorter.
  if (skipped.length <= 4 && stopped.length > skipped.length) {
    return {
      string: "Skips " + englishify(skipped.map(s => stopName(s))),
      icon: expressIcon ? "express" : "stops-all",
      viaLoop: viaLoop
    };
  }

  // Otherwise just list every station it stops at.
  return {
    string: `Stops at ${englishify(stopped.map(s => stopName(s)))}`,
    icon: expressIcon ? "express" : "stops-all",
    viaLoop: viaLoop
  };
}

function englishify(list: string[]): string {
  if (list.length == 0) {
    throw new Error("Cannot englishify an empty list.");
  }
  if (list.length == 1) {
    return list[0];
  }
  if (list.length == 2) {
    return `${list[0]} and ${list[1]}`;
  }
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}
