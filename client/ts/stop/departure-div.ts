import { domA, domP } from "../dom-utils";
import { Network, Stop } from "../network";
import { Departure } from "./departure-request";
import { getStopName } from "../network-utils";
import { DateTime } from "luxon";

const melbTimeZone = "Australia/Melbourne";

export function createDepartureDiv(departure: Departure, network: Network,
  stop: Stop, now: DateTime): HTMLElement {

  const line = network.lines.find(l => l.id == departure.line);
  if (line == null) {
    throw new Error(`Line "${line}" not found.`);
  }

  const serviceUrl = new URL("/train", document.location.origin);
  serviceUrl.searchParams.append("id", departure.service);
  serviceUrl.searchParams.append("from", stop.id.toFixed());

  const departureDiv = domA(serviceUrl.href, `departure accent-${line.color}`);

  const terminus = departure.stops[departure.stops.length - 1].stop;
  const terminusP = domP(getStopName(network, terminus), "terminus");
  departureDiv.append(terminusP);

  const time = timeMelbString(departure.timeUTC, now);
  const timeP = domP(time, "time");
  departureDiv.append(timeP);

  if (departure.platform != null) {
    const platform = stop.platforms.find(p => p.id == departure.platform);
    if (platform == null) {
      throw new Error(`Platform "${departure.platform}" not found.`);
    }

    const platformP = domP(`Platform ${platform.name}`, "platform");
    departureDiv.append(platformP);
  }

  const odometer = odometerString(departure.timeUTC, now);
  const odometerP = domP(odometer, "odometer");
  departureDiv.append(odometerP);

  const lineName = `${line.name} Line`;
  const lineNameP = domP(lineName, "line");
  departureDiv.append(lineNameP);

  return departureDiv;
}

export function timeMelbString(time: DateTime, now: DateTime): string {
  // Todo: Append "tonight", "tomorrow", "yesterday", or the date if appropriate.
  const timeMelb = time.setZone(melbTimeZone);
  const nowMelb = now.setZone(melbTimeZone);
  return timeMelb.toLocaleString(DateTime.TIME_SIMPLE);
}

export function odometerString(time: DateTime, now: DateTime): string {
  const totalMins = Math.floor(time.diff(now).as("minutes"));
  if (totalMins < 0) { return "Departed"; }
  if (totalMins == 0) { return "Now"; }

  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins - hrs * 60;
  if (hrs == 0) { return `${mins.toFixed()} ${mins == 1 ? "min" : "mins"}`; }
  if (mins == 0) { return `${hrs.toFixed()} ${hrs == 1 ? "hr" : "hrs"}`; }

  return `${hrs.toFixed()} ${hrs == 1 ? "hr" : "hrs"}, ` +
    `${mins.toFixed()} ${mins == 1 ? "min" : "mins"}`;
}
