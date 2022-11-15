import { LineGraph, LineID, StopID } from "melbpt-utils";
import { LinePageHtml } from "../../bundles/line";
import { createLineDiagram } from "../../utils/line-diagram";
import { Page } from "../page";
import { getNetwork } from "../../utils/network";
import { domA, domP } from "../../utils/dom-utils";
import { z } from "zod";
import { callApi } from "../../utils/api-call";

/** Zod parser for the API response. */
export const ApiResponseJson = z.object({
  details: z.object({
    lineGraph: LineGraph.json
  })
});

export class LinePage extends Page<LinePageHtml> {
  readonly id: LineID;

  constructor(html: LinePageHtml, id: LineID, apiOrigin: string) {
    super(html, apiOrigin);

    this.id = id;
  }

  async init() {
    const details = (await callApi(
      this.apiOrigin, "line-details/v1", { id: this.id.toFixed() },
      ApiResponseJson
    )).details;

    if (details == null) {
      // todo
      return;
    }

    const lineColor = getNetwork().requireLine(this.id).color;

    const detailer = (stopID: StopID, _express: boolean, insetRem: number) => {
      const stop = getNetwork().requireStop(stopID);
      return createRegularStopDetails(stop.name, stop.urlName, insetRem);
    };

    const lineDiagram = createLineDiagram(
      "line-diagram", details.lineGraph, detailer, lineColor
    );
    this.html.lineDiagramContainer.append(lineDiagram);

    this.html.lineDiagramContainer.classList.remove("gone");
    this.html.lineDiagramContainerLoading.classList.add("gone");
  }
}

function createRegularStopDetails(name: string, stopUrlName: string,
  insetRem: number) {

  const $stopName = domP(name, "stop-name");

  const $details = domA(`/${stopUrlName}`, "stop-details");
  $details.style.paddingLeft = `${(2.5 + insetRem)}rem`;
  $details.append($stopName);

  return $details;
}

function createInterchangeStopDetails(name: string, stopUrlName: string,
  changeMessage: string, insetRem: number) {

  const $stopName = domP(name, "stop-name");
  const $changeMessage = domP(changeMessage, "change-message");

  const $details = domA(`/${stopUrlName}`, "stop-details interchange");
  $details.style.paddingLeft = `${(2.5 + insetRem)}rem`;
  $details.append($stopName, $changeMessage);

  return $details;
}
