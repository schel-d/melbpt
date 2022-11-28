import { DateTime } from "luxon";
import { Departure } from "./departure-request";
import { getNetwork } from "../utils/network";
import { determineStoppingPatternDisplay, getFutureStops, isViaLoop }
  from "./stopping-pattern-string";
import { getSettings } from "../settings/settings";
import { determineStoppingPattern, StoppingPattern } from "./stopping-pattern";

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
   */
  constructor(departure: Departure) {
    // Work out the url for the service (when departure is clicked).
    const serviceUrl = new URL("/train", document.location.origin);
    serviceUrl.searchParams.append("id", departure.service);
    serviceUrl.searchParams.append("from", departure.stop.toFixed());
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
      const stop = getNetwork().requireStop(departure.stop);
      const platform = stop.platforms.find(p => p.id == departure.platform);
      if (platform == null) {
        throw new Error(`Platform "${departure.platform}" not found.`);
      }
      this.platform = platform.name;
    }
    else {
      this.platform = null;
    }

    const pattern = determineStoppingPattern(departure);
    const patternDisplay = determineStoppingPatternDisplay(departure, pattern);
    this.stoppingPattern = patternDisplay.string;
    this.stoppingPatternIcon = patternDisplay.icon;

    // Choose the string to display as the terminus (it might be "via loop", or
    // a continuation).
    this.terminus = determineTerminusString(departure, pattern);
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

function determineTerminusString(departure: Departure, pattern: StoppingPattern): string {
  // Work out the terminus name.
  const terminusStopID = departure.stops[departure.stops.length - 1].stop;
  const terminusName = getNetwork().requireStop(terminusStopID).name;

  // If continuations are relevant...
  if (departure.continuation != null && getSettings().guessContinuations) {
    const continuationStops = departure.continuation.stops;

    const finalStopID = continuationStops[continuationStops.length - 1].stop;
    const finalStopName = getNetwork().requireStop(finalStopID).name;

    // If we're at the transition stop (Flinders Street)...
    const isTransition = continuationStops[0].stop == departure.stop;
    if (isTransition) {
      return terminusName;
    }

    // If none of the continuation's stops will be visited by this service in
    // the future...
    const futureStopsMainService = getFutureStops(departure, departure.stop, true);
    const comesBackHere = continuationStops.slice(1)
      .some(s => futureStopsMainService.includes(s.stop));
    if (!comesBackHere) {
      return `${finalStopName} via ${terminusName}?`;
    }

    // If the main service goes direct to Flinders Street, but then goes around
    // the loop...
    const continuationUsesLoop = isViaLoop(continuationStops.map(s => s.stop));
    if (departure.direction == "up-direct" && continuationUsesLoop) {
      return `${terminusName}, then loop?`;
    }
  }

  // Append "via loop" if appropriate.
  const viaLoop = isViaLoop(getFutureStops(departure, departure.stop, false));
  return viaLoop ? `${terminusName} via loop` : terminusName;
}
