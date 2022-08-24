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

const groups = determineDepartureGroups(stopID);
const divs = groups.map(g => createDepartureGroup(g.style, g.title, g.subtitle));

populateDepartures(divs, groups);

type DepartureGroup = {
  filter: string, style: "three" | "five" | "ten", title: string, subtitle?: string
};

function createDepartureGroup(style: string, title: string, subtitle?: string) {
  const groupDiv = domDiv("departure-group");
  groupDiv.classList.add(`departure-group-${style}`);

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

async function populateDepartures(divs: HTMLDivElement[],
  groups: DepartureGroup[]) {

  divs.forEach(div => {
    const spinner = createLoadingSpinner("loading-spinner");
    div.append(spinner);
  });

  try {
    const response = await fetchDepartures(
      stopID, time, Math.max(...groups.map(g => styleToDepsNumber(g.style))),
      false, groups.map(g => g.filter + " narr nsdo")
    );
    const stop = response.network.stops.find(s => s.id == stopID);
    if (stop == null) { throw new Error(`Couldn't find this stop in the network.`); }

    divs.forEach((div, i) => {
      const maxNum = styleToDepsNumber(groups[i].style);

      if (response.departures[i].length > 0) {
        div.replaceChildren(...response.departures[i].slice(0, maxNum).map(d => {
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

function styleToDepsNumber(style: "three" | "five" | "ten"): number {
  if (style == "three") { return 3; }
  if (style == "ten") { return 10; }
  return 5;
}

function determineDepartureGroups(stopID: number): DepartureGroup[] {
  const flindersStreet = 104;
  const southernCross = 253;
  const melbourneCentral = 171;
  const parliament = 216;
  const flagstaff = 101;

  if (stopID == flindersStreet) {
    return [
      { filter: "", title: "All trains", style: "ten" }
    ];
  }
  if (stopID == southernCross) {
    return [
      { filter: "service-regional", title: "Regional trains", style: "five" },
      { filter: "service-suburban", title: "Suburban trains", style: "five" }
    ];
  }

  if ([flagstaff, melbourneCentral, parliament].includes(stopID)) {
    return [
      {
        filter: "platform-1",
        title: "Platform 1",
        subtitle: "Hurstbridge, Mernda lines",
        style: "three"
      },
      {
        filter: "platform-2",
        title: "Platform 2",
        subtitle: "Cranbourne, Pakenham lines",
        style: "three"
      },
      {
        filter: "platform-3",
        title: "Platform 3",
        subtitle: "Craigeburn, Sunbury, Upfield lines",
        style: "three"
      },
      {
        filter: "platform-4",
        title: "Platform 4",
        subtitle: "Alamein, Belgrave, Glen Waverley, Lilydale lines",
        style: "three"
      }
    ];
  }

  return [
    { filter: "up", title: "Citybound trains", style: "five" },
    { filter: "down", title: "Outbound trains", style: "five" }
  ];
}
