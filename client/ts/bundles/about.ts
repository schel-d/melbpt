import { DateTime } from "luxon";
import { fetchAvailableTimetables } from "../about/timetables-request";
import { domSpan, getElementOrThrow } from "../dom-utils";

const loadingDiv = getElementOrThrow("timetables-loading");
const errorDiv = getElementOrThrow("timetables-error");
const timetablesList = getElementOrThrow("timetables-list");

init();

async function init() {
  try {
    const response = await fetchAvailableTimetables();
    const timetables = response.timetables;
    const network = response.network;

    timetablesList.replaceChildren(...timetables.map(t => {
      const li = document.createElement("li");

      const line = network.lines.find(l => l.id == t.line);
      if (line == null) { throw new Error("Line not found."); }

      const lineNameSpan = domSpan(line.name, "line-name");
      const separatorSpan = domSpan("•", "separator-dot");
      const dateString = t.lastUpdated.toLocaleString(DateTime.DATE_MED);
      li.append(lineNameSpan, separatorSpan, `Last updated: ${dateString}`);

      return {
        li: li,
        name: line.name
      };
    }).sort((a, b) => a.name.localeCompare(b.name)).map(x => x.li));

    loadingDiv.classList.add("gone");
    timetablesList.classList.remove("gone");
  }
  catch (err) {
    console.log(err);
    loadingDiv.classList.add("gone");
    errorDiv.classList.remove("gone");
  }
}
