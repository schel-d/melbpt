import { DateTime } from "luxon";
import { Departure } from "./departure-request";
import { getNetwork } from "../utils/network";
import { determineStoppingPatternDisplay } from "./stopping-pattern-string";
import { determineStoppingPattern, isViaLoop, StoppingPattern } from "./stopping-pattern";
import { flindersStreet, StopID } from "melbpt-utils";

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

    // Store time as simply time, since the live time odometer bases its value
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

    // Choose the string to display as the terminus (it might be "via loop", or
    // a continuation).
    const pattern = determineStoppingPattern(departure);
    this.terminus = determineTerminusString(departure, pattern);

    // Create the stopping pattern string and choose the icon.
    const patternDisplay = determineStoppingPatternDisplay(departure, pattern);
    this.stoppingPattern = patternDisplay.string;
    this.stoppingPatternIcon = patternDisplay.icon;

    // Work out the line name and color.
    //
    // NOTE: While it might be ideal to show a "Cranbourne via Flinders Street"
    // train as being on the "Cranbourne line" even though it is a Pakenham line
    // service which continues to Cranbourne at Flinders Street, I don't think
    // we should, since the API will filter it as a Pakenham line train.
    // Changing how the API filters it would be hard since we'd need to somehow
    // avoid needing to specificize every departure before filtering but still
    // work out the continuations.
    const line = getNetwork().requireLine(departure.line);
    this.color = line.color;
    this.line = line.name;
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
  const stopName = (x: StopID) => getNetwork().requireStop(x).name;

  // If the pattern is empty, this must be the last stop!
  if (pattern.length == 0) {
    return "Arrival";
  }

  // Work out the terminus name.
  const terminus = stopName(pattern[pattern.length - 1].stop);

  // Check if the service goes via Flinders Street or the loop.
  const futureStops = pattern.filter(x => !x.express).map(x => x.stop);
  const continuesViaFlinders = departure.continuation != null
    && futureStops.slice(0, -1).includes(flindersStreet);
  const viaLoop = isViaLoop(futureStops);

  // Displaying a relevant continuation takes priority, then if it's via loop.
  if (continuesViaFlinders) {
    // This one is a guesstimation, the others aren't (I'm pretty sure...)
    return `${terminus} via Flinders Street?`;
  }
  else if (viaLoop) {
    return `${terminus} via Loop`;
  }
  else {
    return terminus;
  }
}
