import { DateTime } from "luxon";
import { domDiv, domH2, domH3, domP, getElementOrThrow } from "../dom-utils";
import { fetchDepartures } from "../stop/departure-request";
import { createDepartureDiv } from "../stop/departure-div";

declare global {
  interface Window { stopID: number }
}

const stopID = window.stopID;
const departuresDiv = getElementOrThrow("departures");
const time = DateTime.utc().plus({ seconds: 5 }).startOf("minute");
const count = 3;

createDepartureGroup("up narr nsdo", "Citybound trains");
createDepartureGroup("down narr nsdo", "Outbound trains");

function createDepartureGroup(filter: string, title: string, subtitle?: string) {
  const groupDiv = domDiv("departure-group");

  const titleElement = domH2(title);
  groupDiv.append(titleElement);

  if (subtitle != null) {
    const subtitleElement = domH3(subtitle);
    groupDiv.append(subtitleElement);
  }

  const departuresListDiv = domDiv("departure-list");
  groupDiv.append(departuresListDiv);

  departuresDiv.append(groupDiv);

  // Intentionally not awaited so multiple createDepartureGroup calls can be
  // made at the same time and run in parallel.
  populateDepartures(departuresListDiv, filter);
}

async function populateDepartures(departuresListDiv: HTMLDivElement, filter: string) {
  try {
    const response = await fetchDepartures(stopID, time, count, false, filter);
    const stop = response.network.stops.find(s => s.id == stopID);
    if (stop == null) { throw new Error(`Couldn't find this stop in the network.`); }

    if (response.departures.length > 0) {
      departuresListDiv.replaceChildren(...response.departures.map(d => {
        return createDepartureDiv(d, response.network, stop, time);
      }));
    }
    else {
      const messageP = domP("No trains scheduled", "message");
      departuresListDiv.replaceChildren(messageP);
    }
  }
  catch (err) {
    const errorP = domP("Something went wrong", "message error");
    departuresListDiv.replaceChildren(errorP);
  }
}
