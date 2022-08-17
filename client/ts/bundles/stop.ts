import { DateTime } from "luxon";
import { domDiv, domH2, domP, domSpan, getElementOrThrow } from "../dom-utils";
import { fetchDepartures } from "../stop/departure-request";
import { createDepartureDiv } from "../stop/departure-div";
import { createLoadingSpinner } from "../loading-spinner";

declare global {
  interface Window { stopID: number }
}

const stopID = window.stopID;
const departuresDiv = getElementOrThrow("departures");
const time = DateTime.utc().plus({ seconds: 5 }).startOf("minute");
const count = 3;

const groups = determineDepartureGroups(stopID);
groups.forEach(g => createDepartureGroup(g));

type DepartureGroup = { filter: string, title: string, subtitle?: string };
function createDepartureGroup(group: DepartureGroup) {
  const groupDiv = domDiv("departure-group");

  const header = domH2("", "departure-group-header");

  const titleElement = domSpan(group.title, "title");
  header.append(titleElement);

  if (group.subtitle != null) {
    const separatorElement = domSpan("•", "separator-dot");
    header.append(separatorElement, group.subtitle);
  }

  groupDiv.append(header);

  const departuresListDiv = domDiv("departure-list");
  groupDiv.append(departuresListDiv);

  departuresDiv.append(groupDiv);

  // Intentionally not awaited so multiple createDepartureGroup calls can be
  // made at the same time and run in parallel.
  populateDepartures(departuresListDiv, group.filter + " narr nsdo");
}

async function populateDepartures(departuresListDiv: HTMLDivElement, filter: string) {
  const spinner = createLoadingSpinner("loading-spinner");
  departuresListDiv.append(spinner);

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

function determineDepartureGroups(stopID: number): DepartureGroup[] {
  const flindersStreet = 104;
  const southernCross = 253;
  const melbourneCentral = 171;
  const parliament = 216;
  const flagstaff = 101;

  if (stopID == southernCross) {
    return [
      { filter: "service-regional", title: "Regional trains" },
      { filter: "service-suburban", title: "Suburban trains" }
    ];
  }

  if ([flagstaff, melbourneCentral, parliament].includes(stopID)) {
    return [
      {
        filter: "platform-1",
        title: "Platform 1",
        subtitle: "Hurstbridge, Mernda lines"
      },
      {
        filter: "platform-2",
        title: "Platform 2",
        subtitle: "Cranbourne, Pakenham lines"
      },
      {
        filter: "platform-3",
        title: "Platform 3",
        subtitle: "Craigeburn, Sunbury, Upfield lines"
      },
      {
        filter: "platform-4",
        title: "Platform 4",
        subtitle: "Alamein, Belgrave, Glen Waverley, Lilydale lines"
      }
    ];
  }

  return [
    { filter: "up", title: "Citybound trains" },
    { filter: "down", title: "Outbound trains" }
  ];
}
