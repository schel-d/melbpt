import { DateTime } from "luxon";
import { getElementOrThrow } from "../dom-utils";
import { fetchDepartures } from "../stop/departure-request";
import { determineDepartureGroups } from "../stop/departure-group";
import { DepartureModel } from "../stop/departure-model";
import { DepartureGroupController } from "../stop/departure-group-controller";
import { TimeControls } from "../stop/time-controls";

declare global { interface Window { stopID: number } }

class StopPage {
  timeButtonText = getElementOrThrow("time-controls-button-text");
  filterButtonText = getElementOrThrow("filter-controls-button-text");
  timeButton = getElementOrThrow("time-controls-button");
  filterButton = getElementOrThrow("filter-controls-button");
  timeDropdown = getElementOrThrow("time-controls-dropdown");
  filterDropdown = getElementOrThrow("filter-controls-dropdown");
  departuresDiv = getElementOrThrow("departures");

  stopID = window.stopID;

  url = new URL(window.location.href);

  timeControls = new TimeControls(
    this.url.searchParams.get("when"),
    () => this.setupDepartures()
  );

  /**
   * The last minute {@link update} ran in.
   */
  lastUpdate: DateTime | null = null;

  /**
   * The interval that runs the update function at the start of every minute.
   * Note: this shouldn't be a node js timer, this code runs in the browser!
   */
  refreshInterval: NodeJS.Timer | null = null;

  constructor() {
    this.setupDepartures();
    this.setupDropdowns();
  }

  setupDepartures() {
    if (this.refreshInterval != null) {
      clearInterval(this.refreshInterval);
    }

    this.timeButtonText.textContent = this.timeControls.buttonText();

    // Decide which groups to make for this page, and create controllers for each.
    // Each group should initially show a loading spinner in it's UI.
    const groups = determineDepartureGroups(this.stopID);
    const controllers = groups.map(g => new DepartureGroupController(g));
    controllers.forEach(c => c.showLoading());

    // Append each departure group's div to the page.
    this.departuresDiv.append(...controllers.map(c => c.groupDiv));

    // Retrieve the departures, update the odometers, etc.
    const now = DateTime.utc().startOf("minute");
    this.lastUpdate = now;
    this.update(controllers, now, true);

    // Every second, check if a new minute has started, and if so, run update()
    // again.
    this.refreshInterval = setInterval(() => {
      const now = DateTime.utc().startOf("minute");
      if (this.lastUpdate == null || !this.lastUpdate.equals(now)) {
        this.lastUpdate = now;
        this.update(controllers, now, false);
      }
    }, 1000);
  }

  /**
   * Runs at the start of each minute. Responsible for updating the departure UIs
   * (pinging the api for updates, counting down the live time odometers, etc.).
   * @param controllers The departure group controllers created in {@link init}.
   * @param now The minute in time that this update is occuring for.
   */
  async update(controllers: DepartureGroupController[], now: DateTime,
    controlsChanged: boolean) {

    // Get each group to update it's departures' live times odometers.
    controllers.forEach(c => c.updateLiveTimes(now));

    if (controlsChanged || this.timeControls.mode == "asap") {
      try {
        // Formulate request to api, and await its response.
        const count = Math.max(...controllers.map(c => c.group.count));
        const filters = controllers.map(c => c.group.filter + " narr nsdo");

        const timeUTC = this.timeControls.timeUTC ?? now;
        const reverse = this.timeControls.mode == "before";
        const response = await fetchDepartures(
          this.stopID, timeUTC, count, reverse, filters
        );

        // Using the up-to-date network data, find this stop.
        const stop = response.network.stops.find(s => s.id == this.stopID);
        if (stop == null) {
          throw new Error(`Couldn't find this stop in the network.`);
        }

        controllers.forEach((c, i) => {
          // Generate the departure models (objects that store just what is
          // displayed) for this group from the api response, and pass them to
          // the controller so it can update the UI.
          const departures = response.departures[i];
          const models = departures.map(d =>
            new DepartureModel(d, stop, response.network)
          );
          c.showDepartures(models);
        });
      }
      catch {
        controllers.forEach(c => c.showError());
      }
    }
  }

  setupDropdowns() {
    const openClass = "open";
    const timeOpen = () => this.timeDropdown.classList.contains(openClass);
    const filterOpen = () => this.filterDropdown.classList.contains(openClass);

    // Open the dropdown if its corresponding button is clicked.
    this.timeButton.addEventListener("click", () => {
      this.timeDropdown.classList.toggle(openClass);
      this.filterDropdown.classList.remove(openClass);
      if (timeOpen()) {
        this.timeControls.onOpened();
      }
    });
    this.filterButton.addEventListener("click", () => {
      this.filterDropdown.classList.toggle(openClass);
      this.timeDropdown.classList.remove(openClass);
    });

    // Allows a click outside either dropdown or an escape key to close them.
    document.addEventListener("click", (e) => {
      const clickedElement = e.target as HTMLElement;
      if (timeOpen() && !this.timeDropdown.contains(clickedElement) &&
        !this.timeButton.contains(clickedElement)) {
        this.timeDropdown.classList.remove(openClass);
        e.preventDefault();
      }
      if (filterOpen() && !this.filterDropdown.contains(clickedElement) &&
        !this.filterButton.contains(clickedElement)) {
        this.filterDropdown.classList.remove(openClass);
        e.preventDefault();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.code == "Escape" && (filterOpen() || timeOpen())) {
        this.timeDropdown.classList.remove(openClass);
        this.filterDropdown.classList.remove(openClass);
        e.preventDefault();
      }
    });
  }
}

new StopPage();
