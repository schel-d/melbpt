import { DateTime } from "luxon";
import { AboutPageHtml } from "../../bundles/about";
import { domSpan } from "../../utils/dom-utils";
import { getLine } from "../../utils/network-utils";
import { Page } from "../page";
import { fetchAvailableTimetables } from "./timetables-request";

/**
 * Controls loading the dynamic content in the about page.
 */
export class AboutPage extends Page<AboutPageHtml> {
  constructor(html: AboutPageHtml) {
    super(html);
  }

  async init() {
    try {
      const timetables = await fetchAvailableTimetables();

      this.html.timetablesList.replaceChildren(...timetables.map(t => {
        const li = document.createElement("li");

        const line = getLine(t.line);
        const lineNameSpan = domSpan(line.name, "line-name");
        const separatorSpan = domSpan("•", "separator-dot");
        const dateString = t.lastUpdated.toLocaleString(DateTime.DATE_MED);
        li.append(lineNameSpan, separatorSpan, `Last updated: ${dateString}`);

        return { li: li, name: line.name };
      }).sort((a, b) => a.name.localeCompare(b.name)).map(x => x.li));

      this.html.loadingDiv.classList.add("gone");
      this.html.timetablesList.classList.remove("gone");
    }
    catch (err) {
      console.log(err);
      this.html.loadingDiv.classList.add("gone");
      this.html.errorDiv.classList.remove("gone");
    }
  }
}
