import { LineID } from "melbpt-utils";
import { LinePageHtml } from "../../bundles/line";
import { dummyDetailer, dummyLineGraph } from "./dummy-diagram-data";
import { createLineDiagram } from "../../utils/line-diagram/line-diagram";
import { Page } from "../page";
import { getNetwork } from "../../utils/network";

export class LinePage extends Page<LinePageHtml> {
  readonly id: LineID;

  constructor(html: LinePageHtml, id: LineID) {
    super(html);

    this.id = id;
  }

  async init() {
    const lineColor = getNetwork().requireLine(this.id).color;
    const lineDiagram = createLineDiagram(
      "line-diagram", dummyLineGraph, dummyDetailer, lineColor
    );
    this.html.lineDiagramContainer.append(lineDiagram);
  }
}
