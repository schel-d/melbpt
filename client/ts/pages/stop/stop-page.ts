import { DateTime } from "luxon";
import { Feed, fetchDepartures } from "../../departures/departure-request";
import { DepartureModel } from "../../departures/departure-model";
import { DepartureGroupController, DepartureGroupControllerTitles }
  from "../../departures/departure-group-controller";
import { TimeControls } from "./time-controls";
import { FilterControls } from "./filter-controls";
import { Page } from "../page";
import { StopPageHtml } from "./bundle";
import { StopID } from "melbpt-utils";
import { getNetwork } from "../../utils/network";
import { FullDepartureFilter } from "../../departures/departure-filter";

/**
 * Controls the interactivity of the stop page.
 */
export class StopPage extends Page<StopPageHtml> {
  /**
   * The stop ID as retrieved from the window object.
   */
  stopID: StopID;

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

  /**
   * True if the page is showing (using pageshow/pagehide events).
   */
  pageShowing = true;

  constructor(html: StopPageHtml, stopID: StopID) {
    super(html);

    this.stopID = stopID;

    // Initialize the controller of the time controls dropdown.
    const url = new URL(window.location.href);
    const whenParam = url.searchParams.get("when");
    this.timeControls = new TimeControls(
      whenParam, () => this.onControlsSet(true)
    );

    // Initialize the controller of the filter controls dropdown.
    const filterParam = url.searchParams.get("filter");
    this.filterControls = new FilterControls(
      filterParam, (a) => this.onControlsSet(a), this.stopID
    );
  }

  async init() {
    // Setup listeners for the dropdown buttons, outside dropdown clicks, and
    // the escape key.
    this.setupDropdownsButtons();

    // Show the departures for the current settings.
    this.setupDepartures();

    // Replace the url with one in the standard format if required.
    this.updateUrl();

    // Update the page showing variable when the events fire.
    document.addEventListener("visibilitychange", () => {
      this.pageShowing = document.visibilityState == "visible";
    });
  }

  /**
   * Runs every time the set button on the time/filter controls are clicked.
   */
  onControlsSet(closeControls: boolean) {
    if (closeControls) {
      this.html.timeDropdown.classList.remove("open");
      this.html.filterDropdown.classList.remove("open");
      this.filterControls.onClosed();
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
    this.html.timeButtonText.textContent = this.timeControls.buttonText();
    this.html.filterButtonText.textContent = this.filterControls.buttonText();

    // Decide which groups to make for this page, and create controllers for each.
    // Each group should initially show a loading spinner in their UI.
    const groups = this.filterControls.getDepartureGroups();
    const count = selectCount(groups.length);
    const controllers: DepartureGroupController[] = [];
    controllers.push(...groups.map(g =>
      new DepartureGroupController(
        g,
        count,
        true,
        DepartureGroupControllerTitles.stopPage(g, this.filterControls.isDefault),
        () => controllers
      )
    ));
    controllers.forEach(c => c.showLoading());

    // Append each departure group's div to the page.
    this.html.departuresDiv.replaceChildren(...controllers.map(c => c.$groupDiv));

    // Retrieve the departures, update the odometers, etc.
    const now = DateTime.utc().startOf("minute");
    this.lastUpdate = now;
    this.update(controllers, now, true);

    // Every second, check if a new minute has started, and if so, run update()
    // again.
    this.refreshInterval = setInterval(() => {
      // Don't refresh if the page isn't showing. This is to combat an error
      // occuring while the device is sleeping.
      if (!this.pageShowing) { return; }

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
        const timeUTC = this.timeControls.timeUTC ?? now;
        const reverse = this.timeControls.mode == "before";
        const count = selectCount(controllers.length);

        // Formulate request to api, and await its response.
        const feeds = controllers.map(c => new Feed(
          this.stopID,
          count,
          new FullDepartureFilter(
            c.group.filter,
            this.filterControls.showArrivals,
            this.filterControls.showSDO
          )
        ));
        const allDepartures = await fetchDepartures(
          this.apiOrigin, timeUTC, reverse, feeds
        );

        // Using the up-to-date network data, find this stop.
        const stop = getNetwork().requireStop(this.stopID);

        controllers.forEach((c, i) => {
          // Generate the departure models (objects that store just what is
          // displayed) for this group from the api response, and pass them to
          // the controller so it can update the UI.
          const departures = allDepartures[i];
          const models = departures.map(d =>
            new DepartureModel(d, stop)
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
    const timeOpen = () => this.html.timeDropdown.classList.contains("open");
    const filterOpen = () => this.html.filterDropdown.classList.contains("open");

    // Open the time controls dropdown if its button is clicked.
    this.html.timeButton.addEventListener("click", () => {
      if (filterOpen()) { this.filterControls.onClosed(); }

      this.html.timeDropdown.classList.toggle("open");
      this.html.filterDropdown.classList.remove("open");

      // Tell the time controls controller to prepare the UI since it's about to
      // be shown.
      if (timeOpen()) { this.timeControls.onOpened(); }
    });

    // Open the filter controls dropdown if its button is clicked.
    this.html.filterButton.addEventListener("click", () => {
      this.html.filterDropdown.classList.toggle("open");
      this.html.timeDropdown.classList.remove("open");

      // Tell the filter controls controller to prepare the UI since it's about
      // to be shown.
      if (filterOpen()) { this.filterControls.onOpened(); }
      else { this.filterControls.onClosed(); }
    });

    // Allows a click outside either dropdown or an escape key to close them.
    document.addEventListener("click", (e) => {
      const clickedElement = e.target as HTMLElement;

      // If the time controls are open and something outside the dropdown is
      // clicked (other than the button itself), then prevent that action and
      // instead close the dropdown.
      if (timeOpen() && !this.html.timeDropdown.contains(clickedElement) &&
        !this.html.timeButton.contains(clickedElement)) {
        this.html.timeDropdown.classList.remove("open");
        e.preventDefault();
      }

      // If the filter controls are open and something outside the dropdown is
      // clicked (other than the button itself), then prevent that action and
      // instead close the dropdown.
      if (filterOpen() && !this.html.filterDropdown.contains(clickedElement) &&
        !this.html.filterButton.contains(clickedElement)) {
        this.html.filterDropdown.classList.remove("open");
        this.filterControls.onClosed();
        e.preventDefault();
      }
    });

    // If the escape key is pressed close any open dropdowns.
    document.addEventListener("keydown", (e) => {
      if (e.code == "Escape" && (filterOpen() || timeOpen())) {
        if (filterOpen()) { this.filterControls.onClosed(); }
        this.html.timeDropdown.classList.remove("open");
        this.html.filterDropdown.classList.remove("open");
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

function selectCount(numOfGroups: number) {
  if (numOfGroups == 1) { return 10; }
  if (numOfGroups < 4) { return 5; }
  return 3;
}
