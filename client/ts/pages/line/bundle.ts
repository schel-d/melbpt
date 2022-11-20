import { toLineID } from "melbpt-utils";
import { finder } from "schel-d-utils-browser";
import { LinePage } from "./line-page";
import { setupPage } from "../page";

declare global {
  interface Window {
    lineID: number
  }
}

const lineID = toLineID(window.lineID);

const html = {
  lineDiagramContainer: finder.div("line-diagram-container"),
  lineDiagramContainerLoading: finder.div("line-diagram-container-loading")
};
export type LinePageHtml = typeof html;

setupPage(() => new LinePage(html, lineID));
