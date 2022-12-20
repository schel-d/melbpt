import { StopPage } from "./stop-page";
import { find } from "schel-d-utils-browser";
import { setupPage } from "../page";
import { toStopID } from "melbpt-utils";

declare global {
  interface Window {
    stopID: number
  }
}

const stopID = toStopID(window.stopID);

const html = {
  timeButtonText: find.any("time-controls-button-text"),
  filterButtonText: find.any("filter-controls-button-text"),
  timeButton: find.any("time-controls-button"),
  filterButton: find.any("filter-controls-button"),
  timeDropdown: find.any("time-controls-dropdown"),
  filterDropdown: find.any("filter-controls-dropdown"),
  departuresDiv: find.any("departures")
};
export type StopPageHtml = typeof html;

setupPage(() => new StopPage(html, stopID));
