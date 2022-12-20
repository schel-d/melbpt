import { toLineID } from "melbpt-utils";
import { find } from "schel-d-utils-browser";
import { LinePage } from "./line-page";
import { setupPage } from "../page";

declare global {
  interface Window {
    lineID: number
  }
}

const lineID = toLineID(window.lineID);

const html = {
  lineDiagramContainer: find.div("line-diagram-container"),
  lineDiagramContainerLoading: find.div("line-diagram-container-loading")
};
export type LinePageHtml = typeof html;

setupPage(() => new LinePage(html, lineID));
