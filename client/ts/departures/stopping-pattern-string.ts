import {
  StopID, flagstaff, melbourneCentral, parliament
} from "melbpt-utils";
import { getNetwork } from "../utils/network";
import { Departure } from "./departure-request";
import { findLastIndex, StoppingPattern } from "./stopping-pattern";

export type StoppingPatternDisplay = {
  string: string,
  icon: "stops-all" | "express" | "not-taking-passengers" | "arrival"
};

/**
 * Returns the string to use for the stopping pattern, assuming the service
 * isn't set down only.
 * @param departure The departure info.
 * @param pattern The stopping pattern.
 */
export function determineStoppingPatternDisplay(departure: Departure,
  pattern: StoppingPattern): StoppingPatternDisplay {

  const stopName = (x: StopID) => getNetwork().requireStop(x).name;

  // If there are no stops in the future, it must be an arrival.
  if (pattern.length == 0) {
    // Only append "not taking passengers" for set down only arrivals.
    const tail = departure.setDownOnly ? " - Not taking passengers" : "";

    const originName = stopName(departure.stops[0].stop);
    return {
      string: `Arrival from ${originName}${tail}`,
      icon: "arrival"
    };
  }

  // If the departure is set down only, then it's "Not taking passengers". This
  // happens after the arrival logic, so when viewing regional arrivals at
  // Southern Cross they say where they're from. Technically all arrivals are
  // "set down only" tbh, so saying so would be a waste anyway.
  if (departure.setDownOnly) {
    return {
      string: "Not taking passengers",
      icon: "not-taking-passengers"
    };
  }

  // Build lists of skipped and stopped stations.
  const skipped = pattern.filter(s => s.express).map(s => s.stop);
  const stopped = pattern.filter(s => !s.express).map(s => s.stop);

  // If there's only one more stop, then it simply "Stops at X only".
  if (stopped.length == 1) {
    return {
      string: `Stops at ${stopName(stopped[0])} only`,
      icon: skipped.length != 0 ? "express" : "stops-all"
    };
  }

  // If every stop is serviced, then it "Stops all stations to X".
  if (skipped.length == 0) {
    return {
      string: `Stops all stations to ${stopName(stopped[stopped.length - 1])}`,
      icon: "stops-all"
    };
  }

  // If there are a few skipped stations, see if "Express X > Y > Z" style
  // strings might work. Don't bother if there are less than 2 stops being
  // skipped.
  if (skipped.length > 2) {
    // Work out where the express run starts and ends.
    const expressStart = pattern.findIndex(s => s.express);
    const expressEnd = findLastIndex(pattern, s => s.express);
    const expressRun = pattern.slice(expressStart, expressEnd);

    // Get the names of stops that aren't express in the run.
    const expressStartStopName = stopName(
      expressStart == 0 ? departure.stop : pattern[expressStart - 1].stop
    );
    const stopsInBetween = expressRun
      .filter(s => !s.express)
      .map(s => stopName(s.stop));
    const expressEndStopName = stopName(pattern[expressEnd + 1].stop);

    // If there's two or less stops breaking up the run, create our string.
    const list = [expressStartStopName, ...stopsInBetween, expressEndStopName];
    if (stopsInBetween.length <= 2) {
      return {
        string: `Express ${list.join(" > ")}`,
        icon: "express"
      };
    }
  }

  if (stopped.length > skipped.length) {
    // If it's quicker to list the skipped stations, and there's four or less of
    // them, do it.
    if (skipped.length <= 4) {
      return {
        string: "Skips " + englishify(skipped.map(s => stopName(s))),
        icon: "stops-all"
      };
    }
  }
  else {
    // If it's quicker to list the stopped at stations, and there's four or less
    // of them, do it.
    if (stopped.length <= 4) {
      return {
        string: "Stops at " + englishify(skipped.map(s => stopName(s))),
        icon: "stops-all"
      };
    }
  }

  // If all else fails, then call it a "Limited express" and shrug in defeat.
  // The user can always tap/click the departure for more info anyway.
  return {
    string: `Limited express`,
    icon: "express"
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
