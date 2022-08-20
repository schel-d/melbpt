import { domA, domDiv, domIconify, domP } from "../dom-utils";
import { Network, Stop } from "../network";
import { Departure } from "./departure-request";
import { getStopName } from "../network-utils";
import { DateTime } from "luxon";
import { odometerString, timeMelbString } from "../time-utils";

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
  const stack = domDiv("stack");

  const titleRow = domDiv("title-row");

  const terminus = departure.stops[departure.stops.length - 1].stop;
  const terminusP = domP(getStopName(network, terminus), "terminus");
  titleRow.append(terminusP);

  const separator = domP("•", "separator-dot");
  titleRow.append(separator);

  const time = timeMelbString(departure.timeUTC, now);
  const timeP = domP(time, "time");
  titleRow.append(timeP);

  const separator2 = domDiv("flex-grow");
  titleRow.append(separator2);

  if (departure.platform != null) {
    const platform = stop.platforms.find(p => p.id == departure.platform);
    if (platform == null) {
      throw new Error(`Platform "${departure.platform}" not found.`);
    }

    const platformP = domP(`Plat. ${platform.name}`, "platform");
    titleRow.append(platformP);
  }

  stack.append(titleRow);

  const odometerRow = domDiv("odometer-row");

  const odometer = odometerString(departure.timeUTC, now);
  const odometerP = domP(odometer, "odometer");
  odometerRow.append(odometerP);

  const separator3 = domDiv("flex-grow");
  odometerRow.append(separator3);

  const lineName = `${line.name} Line`;
  const lineNameP = domP(lineName, "line");
  odometerRow.append(lineNameP);

  stack.append(odometerRow);

  const rightArrow = domIconify("uil:angle-right-b", "arrow");
  departureDiv.append(stack, rightArrow);

  return departureDiv;
}
