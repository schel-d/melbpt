import { flagstaff, melbourneCentral, parliament, StopID } from "melbpt-utils";
import { getSettings } from "../settings/settings";
import { getNetwork } from "../utils/network";
import { Departure } from "./departure-request";

/** The stopping pattern of the service and (potentially) its continuation. */
export type StoppingPattern = {
  stop: StopID,
  express: boolean
}[];

/**
 * Returns the stops this service makes in the future (not including the given
 * departure's stop) that are relevant to a passenger at the departure stop,
 * taking continuations into account. For example, a passenger at Jolimont may
 * care that their train continues around to Parliament, but any stops beyond
 * that are irrelevant, so for that train this function would return all the
 * stops up to Parliament. The last stop in the pattern that is returned is
 * guaranteed to not be an express stop.
 * @param departure The departure.
 */
export function determineStoppingPattern(departure: Departure): StoppingPattern {
  // Get the stopping pattern for the main service.
  const mainLine = getNetwork().requireLine(departure.line);
  const mainDirStops = mainLine.requireDirection(departure.direction).stops;
  const mainTimes = mainDirStops.map(s => {
    return {
      stop: s,
      time: departure.stops.find(t => t.stop == s)?.timeUTC ?? null
    };
  });

  let times = mainTimes;

  // If there's a continuation (and we're not at the transition stop)...
  if (departure.continuation != null && getSettings().guessContinuations
    && departure.continuation.stops[0].stop != departure.stop) {

    const continuation = departure.continuation;
    const contLine = getNetwork().requireLine(continuation.line);
    const contDirStops = contLine.requireDirection(continuation.direction).stops.slice(1);
    const contTimes = contDirStops.map(s => {
      return {
        stop: s,
        time: continuation.stops.find(t => t.stop == s)?.timeUTC ?? null
      };
    });

    times = [...mainTimes, ...contTimes];
  }

  // Remove all stops from the pattern before (and including) the stop the
  // departure is from.
  const currStopIndex = times.findIndex(p =>
    p.stop == departure.stop && p.time != null && p.time.equals(departure.timeUTC)
  );
  const futureTimes = times.slice(currStopIndex);

  // Remove all stops after (and including) any duplicated stops. Most normal
  // people don't take a train to end up back where they started!
  const firstDuplicateIndex = getFirstDuplicateIndex(futureTimes.map(p => p.stop));
  const relevantTimes = futureTimes.slice(0, firstDuplicateIndex);

  // Remove all express stops at the end of the list (if any).
  const lastStopIndex = findLastIndex(relevantTimes, p => p.time != null);
  const trimmedTimes = relevantTimes.slice(1, lastStopIndex + 1);

  // Convert the times to a stopping pattern, and return.
  const result = trimmedTimes.map(t => {
    return { stop: t.stop, express: t.time == null };
  });

  return result;
}

/**
 * Returns the index of the first duplicated item, e.g. returns 3 for
 * [6, 7, 4, 7, 6], since "7" is at index 3, and "7" was already in the array at
 * index 1. Returns the array's length if no items are duplicated.
 * @param array The array.
 */
function getFirstDuplicateIndex<T>(array: T[]): number {
  for (let i = 0; i < array.length; i++) {
    // Return this index if this is not the first occurance of this item.
    if (array.indexOf(array[i]) != i) {
      return i;
    }
  }

  // Return the array's length if no items are duplicated.
  return array.length;
}

/**
 * Returns the index of the last item that matches the predicate. Returns -1 if
 * nothing matches the predicate.
 * @param array The array.
 */
export function findLastIndex<T>(array: T[], predicate: (thing: T) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    // Return the index of the item matching the predicate.
    if (predicate(array[i])) {
      return i;
    }
  }

  // Return -1 if nothing matches the predicate.
  return -1;
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
