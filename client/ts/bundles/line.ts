import { toLineID } from "melbpt-utils";
import { finder } from "schel-d-utils-browser";
import { LinePage } from "../pages/line/line-page";
import { setupPage } from "../pages/page";

// Retrieve the stop ID from the window object. The stop ID is stored in the
// window by a script created dynamically by the server (check the pug
// file).
declare global { interface Window { lineID: number } }
const lineID = toLineID(window.lineID);

const html = {
  lineDiagramContainer: finder.div("line-diagram-container")
};
export type LinePageHtml = typeof html;

setupPage(() => new LinePage(html, lineID));
