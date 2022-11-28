import { domDiv, domIconify, domOneLineP, domP } from "../utils/dom-utils";
import { DateTime } from "luxon";
import { minsDelta, odometerString, timeMelbString } from "../utils/time-utils";
import { DepartureModel } from "./departure-model";
import { OdometerController } from "schel-d-utils-browser";

export const departureHeightRem = 6.2;

/**
 * Create a div for a departure. Returns a reference to the div so it can be
 * added to the UI, and the odometer so that it's value can be updated.
 * @param model The departure info shown in the UI.
 * @param now The current time (used to calculate what is shown on the time
 * countdown).
 */
export function createDepartureDiv(model: DepartureModel, now: DateTime) {
  // Create "title" row (terminus, time --- platform)
  const titleRow = domDiv("title-row");
  const terminusP = domOneLineP(model.terminus, "terminus");
  const separator = domP("•", "separator-dot");
  const timeP = domP(timeMelbString(model.timeUTC, now), "time");
  const separator2 = domDiv("flex-grow");
  titleRow.append(terminusP, separator, timeP, separator2);
  if (model.platform != null) {
    const platformP = domP(`Plat. ${model.platform}`, "platform");
    titleRow.append(platformP);
  }

  // Create "live" row (Live time (mins countdown) --- line)
  const liveRow = domDiv("live-row");
  const mins = minsDelta(model.timeUTC, now);
  const liveTime = new OdometerController(
    mins,
    (a, b) => odometerString(a) == odometerString(b),
    x => domOneLineP(odometerString(x), "live-time")
  );
  liveTime.div.classList.add("flex-grow");
  const lineNameP = domP(`${model.line} Line`);
  const lineNameDiv = domDiv("line");
  lineNameDiv.append(lineNameP);
  liveRow.append(liveTime.div, lineNameDiv);

  // Create the "info" row, detailing the stopping pattern.
  const stoppingPatternIcon = domIconify(iconifyIcon(model.stoppingPatternIcon));
  const stoppingPatternP = domP(model.stoppingPattern);
  const stoppingPatternPDiv = domDiv("one-line stopping-pattern");
  stoppingPatternPDiv.append(stoppingPatternP);
  const infoRow = domDiv("info-row");
  infoRow.append(stoppingPatternIcon, stoppingPatternPDiv);

  // Create stack which houses the rows.
  const stack = domDiv("stack");
  stack.append(titleRow, liveRow, infoRow);

  // Create right arrow indicating this can be clicked.
  const rightArrow = domIconify("uil:angle-right-b", "arrow");

  // Create parent div.
  const departureDiv = domDiv("departure-content");
  departureDiv.classList.add(`accent-${model.color}`);
  departureDiv.append(stack, rightArrow);

  // Return parent div and odometer controller.
  return {
    departureDiv: departureDiv,
    liveTimeOdometer: liveTime
  };
}

function iconifyIcon(stoppingPatternIcon: "stops-all" | "express" |
  "not-taking-passengers" | "arrival"): string {

  if (stoppingPatternIcon == "express") {
    return "uil:bolt-alt";
  }
  if (stoppingPatternIcon == "not-taking-passengers") {
    return "uil:minus-circle";
  }
  if (stoppingPatternIcon == "arrival") {
    return "uil:minus-circle";
  }

  return "uil:map-marker";
}
