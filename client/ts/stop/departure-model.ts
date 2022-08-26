import { DateTime } from "luxon"
import { Network, Stop } from "../network";
import { Departure } from "./departure-request";
import { getStopName } from "../network-utils";

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

  /**
   * Creates a departure model from a departure.
   * @param departure The departure.
   * @param stop The stop the departure departs from.
   * @param network The network object.
   */
  constructor(departure: Departure, stop: Stop, network: Network) {
    const serviceUrl = new URL("/train", document.location.origin);
    serviceUrl.searchParams.append("id", departure.service);
    serviceUrl.searchParams.append("from", stop.id.toFixed());
    this.serviceUrl = serviceUrl.href;

    const line = network.lines.find(l => l.id == departure.line);
    if (line == null) { throw new Error(`Line "${line}" not found.`); }
    this.color = line.color;
    this.line = line.name;

    const terminusStopID = departure.stops[departure.stops.length - 1].stop;
    this.terminus = getStopName(network, terminusStopID);

    this.timeUTC = departure.timeUTC;

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
