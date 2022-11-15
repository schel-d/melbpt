import { StopPage } from "../pages/stop/stop-page";
import { finder } from "schel-d-utils-browser";
import { setupPage } from "../pages/page";
import { toStopID } from "melbpt-utils";

declare global {
  interface Window {
    stopID: number,
    apiOrigin: string
  }
}

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

setupPage(() => new StopPage(html, stopID, window.apiOrigin));
