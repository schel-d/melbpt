import { DateTime } from "luxon";
import { lineIDZodSchema } from "melbpt-utils";
import { z } from "zod";
import { AboutPageHtml } from "../../bundles/about";
import { callApi } from "../../utils/api-call";
import { domA, domP, domSpan } from "../../utils/dom-utils";
import { getNetwork } from "../../utils/network";
import { dateTimeZodSchema } from "../../utils/time-utils";
import { Page } from "../page";

/** Zod parser for the API response */
export const ApiResponseJson = z.object({
  timetables: z.object({
    line: lineIDZodSchema,
    lastUpdated: dateTimeZodSchema
  }).array()
});

/** Controls loading the dynamic content on the about page. */
export class AboutPage extends Page<AboutPageHtml> {
  constructor(html: AboutPageHtml) {
    super(html);
  }

  async init() {
    try {
      const response = await callApi(
        this.apiOrigin, "timetables/v1", {}, ApiResponseJson
      );
      const timetables = response.timetables;

      this.html.timetablesList.replaceChildren(...timetables.map(t => {
        const line = getNetwork().requireLine(t.line);

        const $lineNameSpan = domSpan(line.name, "line-name");
        const $separatorSpan = domSpan("•", "separator-dot");
        const dateString = t.lastUpdated.toLocaleString(DateTime.DATE_MED);

        const $p = domP("");
        $p.append($lineNameSpan, $separatorSpan, `Last updated: ${dateString}`);

        const $anchor = domA(`/lines/${t.line.toFixed()}`);
        $anchor.appendChild($p);

        const $li = document.createElement("li");
        $li.appendChild($anchor);

        return { li: $li, name: line.name };
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
