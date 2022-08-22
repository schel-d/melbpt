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
const count = 5;

const groups = determineDepartureGroups(stopID);
const divs = groups.map(g => createDepartureGroup(g.title, g.subtitle));

populateDepartures(divs, groups.map(g => g.filter + " narr nsdo"));

type DepartureGroup = { filter: string, title: string, subtitle?: string };
function createDepartureGroup(title: string, subtitle?: string) {
  const groupDiv = domDiv("departure-group");

  const header = domH2("", "departure-group-header");

  const titleElement = domSpan(title, "title");
  header.append(titleElement);

  if (subtitle != null) {
    const separatorElement = domSpan("•", "separator-dot");
    header.append(separatorElement, subtitle);
  }

  groupDiv.append(header);

  const departuresListDiv = domDiv("departure-list");
  groupDiv.append(departuresListDiv);

  departuresDiv.append(groupDiv);

  return departuresListDiv;
}

async function populateDepartures(divs: HTMLDivElement[], filters: string[]) {
  divs.forEach(div => {
    const spinner = createLoadingSpinner("loading-spinner");
    div.append(spinner);
  });

  try {
    const response = await fetchDepartures(stopID, time, count, false, filters);
    const stop = response.network.stops.find(s => s.id == stopID);
    if (stop == null) { throw new Error(`Couldn't find this stop in the network.`); }

    divs.forEach((div, i) => {
      if (response.departures[i].length > 0) {
        div.replaceChildren(...response.departures[i].map(d => {
          return createDepartureDiv(d, response.network, stop, time);
        }));
      }
      else {
        const messageP = domP("No trains scheduled", "message");
        div.replaceChildren(messageP);
      }
    });
  }
  catch (err) {
    divs.forEach(div => {
      const errorP = domP("Something went wrong", "message error");
      div.replaceChildren(errorP);
    });
  }
}

function determineDepartureGroups(stopID: number): DepartureGroup[] {
  const flindersStreet = 104;
  const southernCross = 253;
  const melbourneCentral = 171;
  const parliament = 216;
  const flagstaff = 101;

  if (stopID == flindersStreet) {
    return [
      { filter: "", title: "All trains" }
    ];
  }
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
