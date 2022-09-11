import { DateTime } from "luxon";
import { getElementOrThrow } from "../dom-utils";
import { fetchDepartures } from "../stop/departure-request";
import { getDefaultDepartureGroups } from "../stop/departure-group";
import { DepartureModel } from "../stop/departure-model";
import { DepartureGroupController } from "../stop/departure-group-controller";
import { TimeControls } from "../stop/time-controls";
import { FilterControls } from "../stop/filter-controls";
import { getNetwork, Network } from "../network";

declare global { interface Window { stopID: number } }

/**
 * Controls the interactivity of the stop page.
 */
class StopPage {
  timeButtonText: HTMLElement;
  filterButtonText: HTMLElement;
  timeButton: HTMLElement;
  filterButton: HTMLElement;
  timeDropdown: HTMLElement;
  filterDropdown: HTMLElement;
  departuresDiv: HTMLElement;

  /**
   * The stop ID as retrieved from the window object.
   */
  stopID: number;

  /**
   * The object responsible for managing the content of the time controls
   * dropdown.
   */
  timeControls: TimeControls;

  /**
   * The object responsible for managing the content of the filter controls
   * dropdown.
   */
  filterControls: FilterControls;

  /**
   * The last minute {@link update} ran in.
   */
  lastUpdate: DateTime | null = null;

  /**
   * The interval that runs the update function at the start of every minute.
   * Note: this shouldn't really be a node js timer, this code runs in the
   * browser!
   */
  refreshInterval: NodeJS.Timer | null = null;

  constructor(network: Network) {
    // Get references to all the elements this call must control.
    this.timeButtonText = getElementOrThrow("time-controls-button-text");
    this.filterButtonText = getElementOrThrow("filter-controls-button-text");
    this.timeButton = getElementOrThrow("time-controls-button");
    this.filterButton = getElementOrThrow("filter-controls-button");
    this.timeDropdown = getElementOrThrow("time-controls-dropdown");
    this.filterDropdown = getElementOrThrow("filter-controls-dropdown");
    this.departuresDiv = getElementOrThrow("departures");

    // Retrieve the stop ID from the window object. The stop ID is stored in the
    // window by a script created dynamically by the server (check the pug
    // file).
    this.stopID = window.stopID;

    // Initialize the controller of the time controls dropdown.
    const url = new URL(window.location.href);
    const whenParam = url.searchParams.get("when");
    this.timeControls = new TimeControls(
      whenParam, () => this.onControlsSet(true)
    );

    const filterParam = url.searchParams.get("filter");
    this.filterControls = new FilterControls(
      filterParam, (a) => this.onControlsSet(a), this.stopID, network
    );

    // Setup listeners for the dropdown buttons, outside dropdown clicks, and
    // the escape key.
    this.setupDropdownsButtons();

    // Show the departures for the current settings.
    this.setupDepartures();

    // Replace the url with one in the standard format if required.
    this.updateUrl();
  }

  /**
   * Runs every time the set button on the time controls are clicked.
   */
  onControlsSet(closeControls: boolean) {
    if (closeControls) {
      this.timeDropdown.classList.remove("open");
      this.filterDropdown.classList.remove("open");
    }

    this.updateUrl();
    this.setupDepartures();
  }

  /**
   * Show the departures, based on the settings in the time controls object.
   */
  setupDepartures() {
    // Clear the old refresh interval, since calling this function will start a
    // new one.
    if (this.refreshInterval != null) {
      clearInterval(this.refreshInterval);
    }

    // Update the text shown on the controls dropdown buttons.
    this.timeButtonText.textContent = this.timeControls.buttonText();
    this.filterButtonText.textContent = this.filterControls.buttonText();

    // Decide which groups to make for this page, and create controllers for each.
    // Each group should initially show a loading spinner in their UI.
    const groups = this.filterControls.getDepartureGroups();
    const controllers = groups.map(g => new DepartureGroupController(g));
    controllers.forEach(c => c.showLoading());

    // Append each departure group's div to the page.
    this.departuresDiv.replaceChildren(...controllers.map(c => c.groupDiv));

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
        const filters = controllers.map(c => {
          const result = [c.group.filter];
          if (!this.filterControls.showArrivals) { result.push("narr"); }
          if (!this.filterControls.showSetDownOnly) { result.push("nsdo"); }
          return result.join(" ");
        });
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
        // If anything goes wrong show an error message inside each departure
        // group.
        controllers.forEach(c => c.showError());
      }
    }
  }

  /**
   * Setup listeners for the dropdown buttons, outside dropdown clicks, and the
   * escape key.
   */
  setupDropdownsButtons() {
    const timeOpen = () => this.timeDropdown.classList.contains("open");
    const filterOpen = () => this.filterDropdown.classList.contains("open");

    // Open the time controls dropdown if its button is clicked.
    this.timeButton.addEventListener("click", () => {
      this.timeDropdown.classList.toggle("open");
      this.filterDropdown.classList.remove("open");

      // Tell the time controls controller to prepare the UI since it's about to
      // be shown.
      if (timeOpen()) { this.timeControls.onOpened(); }
    });

    // Open the filter controls dropdown if its button is clicked.
    this.filterButton.addEventListener("click", () => {
      this.filterDropdown.classList.toggle("open");
      this.timeDropdown.classList.remove("open");

      // Tell the filter controls controller to prepare the UI since it's about
      // to be shown.
      if (filterOpen()) { this.filterControls.onOpened(); }
    });

    // Allows a click outside either dropdown or an escape key to close them.
    document.addEventListener("click", (e) => {
      const clickedElement = e.target as HTMLElement;

      // If the time controls are open and something outside the dropdown is
      // clicked (other than the button itself), then prevent that action and
      // instead close the dropdown.
      if (timeOpen() && !this.timeDropdown.contains(clickedElement) &&
        !this.timeButton.contains(clickedElement)) {
        this.timeDropdown.classList.remove("open");
        e.preventDefault();
      }

      // If the filter controls are open and something outside the dropdown is
      // clicked (other than the button itself), then prevent that action and
      // instead close the dropdown.
      if (filterOpen() && !this.filterDropdown.contains(clickedElement) &&
        !this.filterButton.contains(clickedElement)) {
        this.filterDropdown.classList.remove("open");
        e.preventDefault();
      }
    });

    // If the escape key is pressed close any open dropdowns.
    document.addEventListener("keydown", (e) => {
      if (e.code == "Escape" && (filterOpen() || timeOpen())) {
        this.timeDropdown.classList.remove("open");
        this.filterDropdown.classList.remove("open");
        e.preventDefault();
      }
    });
  }

  /**
   * Replace the url with one in the standard format if required. Uses the
   * current values in {@link timeControls}.
   */
  updateUrl() {
    // Get the page's base url (without the query params), and use it as the
    // base for the ideal url.
    const currentPage = window.location.href.toString().split("?")[0];
    const idealUrl = new URL(currentPage);

    const whenParam = this.timeControls.encodeParamString();
    if (whenParam != null) {
      idealUrl.searchParams.set("when", whenParam);
    }

    const filterParam = this.filterControls.encodeParamString();
    if (filterParam != null) {
      idealUrl.searchParams.set("filter", filterParam);
    }

    // Do nothing if the urls match.
    if (window.location.href == idealUrl.href) { return; }

    // Replace the current url without reloading the page.
    history.replaceState({}, "", idealUrl.href);
  }
}

// We don't need to store it, but create a stop page object to run the code.
getNetwork().then(network => new StopPage(network));
