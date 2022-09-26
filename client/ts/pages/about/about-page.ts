import { DateTime } from "luxon";
import { domSpan, getElementOrThrow } from "../../utils/dom-utils";
import { fetchAvailableTimetables } from "./timetables-request";

/**
 * Controls loading the dynamic content in the about page.
 */
export class AboutPage {
  loadingDiv: HTMLElement;
  errorDiv: HTMLElement;
  timetablesList: HTMLElement;

  constructor() {
    this.loadingDiv = getElementOrThrow("timetables-loading");
    this.errorDiv = getElementOrThrow("timetables-error");
    this.timetablesList = getElementOrThrow("timetables-list");
  }

  async init() {
    try {
      const response = await fetchAvailableTimetables();
      const timetables = response.timetables;
      const network = response.network;

      this.timetablesList.replaceChildren(...timetables.map(t => {
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

      this.loadingDiv.classList.add("gone");
      this.timetablesList.classList.remove("gone");
    }
    catch (err) {
      console.log(err);
      this.loadingDiv.classList.add("gone");
      this.errorDiv.classList.remove("gone");
    }
  }
}
