import {
  Line, StopID, flagstaff, melbourneCentral, parliament, flindersStreet
} from "melbpt-utils";
import { getNetwork } from "../utils/network";
import { Departure } from "./departure-request";

export type StoppingPattern = {
  string: string,
  icon: "stops-all" | "express" | "not-taking-passengers" | "arrival"
};

/**
 * Returns the string to use for the stopping pattern, assuming the service
 * isn't set down only.
 * @param departure The departure info.
 * @param stop The stop of the station the passenger is waiting at.
 * @param line The line information of the service.
 */
export function determineStoppingPattern(departure: Departure, stop: StopID,
  line: Line): StoppingPattern {

  const stopName = (x: StopID) => getNetwork().requireStop(x).name;

  // Get the future stops on this service (list of stop IDs).
  const stopsAfterNow = getFutureStops(departure, stop, false);

  // If there are no stops in the future, it must be an arrival.
  if (stopsAfterNow.length == 0) {
    const originName = stopName(departure.stops[0].stop);
    return {
      string: `Arrival from ${originName} - Not taking passengers`,
      icon: "arrival"
    };
  }

  if (departure.setDownOnly) {
    return {
      string: "Not taking passengers",
      icon: "not-taking-passengers"
    };
  }

  const terminus = stopsAfterNow[stopsAfterNow.length - 1];

  // Get the future stops on this line (list of stop IDs).
  const direction = line.directions.find(d => d.id == departure.direction);
  if (direction == null) { throw new Error("Couldn't find direction."); }
  const stopsAfterNowOnLine = direction.stops
    .slice(direction.stops.indexOf(stop) + 1, direction.stops.indexOf(terminus) + 1);

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
      icon: expressIcon ? "express" : "stops-all"
    };
  }

  // If every stop is serviced, then it stops all stations.
  if (futureStops.every(s => s.stopped)) {
    // Determine whether this service stops in the city loop in the future. Only
    // true if it stops at all the underground stations, since there's no point
    // saying "via city loop" if you're already at Melbourne Central.
    const viaLoop = isViaLoop(stopsAfterNow);

    if (viaLoop) {
      return {
        string: `Stops all stations via city loop`,
        icon: "stops-all"
      };
    }
    if (terminus == flindersStreet && !viaLoop) {
      return {
        string: `Stops all stations direct to ${stopName(flindersStreet)}`,
        icon: "stops-all"
      };
    }
    return {
      string: `Stops all stations`,
      icon: "stops-all"
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
      ? stop
      : futureStops[expressStart - 1].stop;
    const expressStartStopName = stopName(expressStartStopID);

    if (stopsInBetween.length == 0) {
      return {
        string: `Express ${expressStartStopName} > ${expressEndStopName}`,
        icon: expressIcon ? "express" : "stops-all"
      };
    }
    else if (stopsInBetween.length == 1) {
      return {
        string: `Express ${expressStartStopName} > ${stopsInBetween[0]}`
          + ` > ${expressEndStopName}`,
        icon: expressIcon ? "express" : "stops-all"
      };
    }
    else if (stopsInBetween.length == 2) {
      return {
        string: `Express ${expressStartStopName} > ${stopsInBetween[0]}`
          + ` > ${stopsInBetween[1]} > ${expressEndStopName}`,
        icon: expressIcon ? "express" : "stops-all"
      };
    }
  }

  // If 4 or less stations are skipped, just list them, unless listing the stops
  // it DOES stop at is still shorter.
  if (skipped.length <= 4 && stopped.length > skipped.length) {
    return {
      string: "Skips " + englishify(skipped.map(s => stopName(s))),
      icon: expressIcon ? "express" : "stops-all"
    };
  }

  // Otherwise just list every station it stops at.
  return {
    string: `Stops at ${englishify(stopped.map(s => stopName(s)))}`,
    icon: expressIcon ? "express" : "stops-all"
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

/**
 * Returns true if the given list of stops includes every underground city-loop
 * station.
 * @param futureStops The stops.
 */
export function isViaLoop(futureStops: StopID[]) {
  return [flagstaff, melbourneCentral, parliament]
    .every(s => futureStops.includes(s));
}

/**
 * Returns the list of stops on this departure this occur after the given stop,
 * if any.
 * @param departure The departure.
 * @param stop The stop.
 * @param inclusive Include the given stop in the list.
 */
export function getFutureStops(departure: Departure, stop: StopID,
  inclusive: boolean) {

  return departure.stops
    .map(s => s.stop)
    .slice(departure.stops.findIndex(s => s.stop == stop) + (inclusive ? 0 : 1));
}
