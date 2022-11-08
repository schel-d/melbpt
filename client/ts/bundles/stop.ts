import { StopPage } from "../pages/stop/stop-page";
import { finder } from "schel-d-utils-browser";
import { setupPage } from "../pages/page";
import { toStopID } from "melbpt-utils";

// Retrieve the stop ID from the window object. The stop ID is stored in the
// window by a script created dynamically by the server (check the pug
// file).
declare global { interface Window { stopID: number } }
const stopID = toStopID(window.stopID);

const html = {
  timeButtonText: finder.any("time-controls-button-text"),
  filterButtonText: finder.any("filter-controls-button-text"),
  timeButton: finder.any("time-controls-button"),
  filterButton: finder.any("filter-controls-button"),
  timeDropdown: finder.any("time-controls-dropdown"),
  filterDropdown: finder.any("filter-controls-dropdown"),
  departuresDiv: finder.any("departures")
};
export type StopPageHtml = typeof html;

setupPage(() => new StopPage(html, stopID));
