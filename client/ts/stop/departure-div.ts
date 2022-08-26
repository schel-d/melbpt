import { domDiv, domIconify, domP } from "../dom-utils";
import { DateTime } from "luxon";
import { minsDelta, odometerString, timeMelbString } from "../time-utils";
import { DepartureModel } from "./departure-model";
import { OdometerController } from "./odometer";

export function createDepartureDiv(departure: DepartureModel, now: DateTime) {
  const departureDiv = domDiv("departure-content");
  departureDiv.classList.add(`accent-${departure.color}`);

  const stack = domDiv("stack");

  const titleRow = domDiv("title-row");
  const terminusP = domP(departure.terminus, "terminus");
  const separator = domP("•", "separator-dot");
  const timeP = domP(timeMelbString(departure.timeUTC, now), "time");
  const separator2 = domDiv("flex-grow");
  titleRow.append(terminusP, separator, timeP, separator2);
  if (departure.platform != null) {
    const platformP = domP(`Plat. ${departure.platform}`, "platform");
    titleRow.append(platformP);
  }

  const mins = minsDelta(departure.timeUTC, now);


  const odometerRow = domDiv("live-row");
  const odometer = new OdometerController(
    mins,
    (a, b) => a == b,
    (x) => {
      return domP(odometerString(x), "live-time");
    }
  );
  odometer.div.classList.add("flex-grow");
  const lineNameP = domP(`${departure.line} Line`, "line");
  odometerRow.append(odometer.div, lineNameP);


  // setInterval(() => {
  //   odometer.update(Math.floor(Math.random() * 120));
  // }, 1000);

  stack.append(titleRow, odometerRow);

  const rightArrow = domIconify("uil:angle-right-b", "arrow");
  departureDiv.append(stack, rightArrow);

  return {
    departureDiv: departureDiv,
    odometer: odometer
  };
}
