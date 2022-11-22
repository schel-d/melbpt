import { Page } from "../page";
import { IndexPageHtml } from "./bundle";
import { DepartureGroupController, DepartureGroupControllerTitles }
  from "../../departures/departure-group-controller";
import { DateTime } from "luxon";
import { Feed, fetchDepartures } from "../../departures/departure-request";
import { DepartureModel } from "../../departures/departure-model";
import { initSearch, displayResults } from "../../page-template/search-ui";
import { getNetwork } from "../../utils/network";
import { searchOptionsWholeSite } from "../../page-template/search";
import { DepartureGroup } from "../../departures/departure-group";
import { FullDepartureFilter } from "../../departures/departure-filter";
import { getSettings } from "../../settings/settings";

const departuresCount = 3;

/** Controls interactivity on the index page. */
export class IndexPage extends Page<IndexPageHtml> {
  /** The last minute {@link update} ran in. */
  lastUpdate: DateTime | null = null;

  /** True if the page is showing (using pageshow/pagehide events). */
  pageShowing = true;

  constructor(html: IndexPageHtml) {
    super(html);
  }

  async init() {
    initSearch(
      this.html.mainSearchInput,
      this.html.mainSearchForm,
      () => searchOptionsWholeSite(),
      (results, message) => displayResults(
        this.html.mainSearchResults, results, message
      )
    );

    // Update the page showing variable when the events fire.
    document.addEventListener("visibilitychange", () => {
      this.pageShowing = document.visibilityState == "visible";
    });

    const groups = getSettings().pinnedWidgets;
    this.html.departuresParentDiv.classList.remove("loading");
    this.html.departuresParentDiv.classList.toggle("empty", groups.length < 1);

    if (groups.length > 0) {
      this.initDepartureWidgets(groups);
    }
  }

  async initDepartureWidgets(groups: DepartureGroup[]) {
    const controllers: DepartureGroupController[] = [];
    controllers.push(...groups.map(g => {
      return new DepartureGroupController(
        g, departuresCount, false,
        DepartureGroupControllerTitles.pinnedWidgets(g),
        () => controllers
      );
    }));
    controllers.forEach(c => c.showLoading());

    // Append each departure group's div to the page.
    this.html.departuresDiv.replaceChildren(...controllers.map(c => c.$groupDiv));

    // Retrieve the departures, update the odometers, etc.
    const now = DateTime.utc().startOf("minute");
    this.lastUpdate = now;
    this.update(controllers, now);

    // Every second, check if a new minute has started, and if so, run update()
    // again.
    setInterval(() => {
      // Don't refresh if the page isn't showing. This is to combat an error
      // occuring while the device is sleeping.
      if (!this.pageShowing) { return; }

      const now = DateTime.utc().startOf("minute");
      if (this.lastUpdate == null || !this.lastUpdate.equals(now)) {
        this.lastUpdate = now;
        this.update(controllers, now);
      }
    }, 1000);
  }

  /**
   * Runs at the start of each minute. Responsible for updating the departure UIs
   * (pinging the api for updates, counting down the live time odometers, etc.).
   * @param controllers The departure group controllers created in {@link init}.
   * @param now The minute in time that this update is occuring for.
   */
  async update(controllers: DepartureGroupController[], now: DateTime) {
    // Get each group to update it's departures' live times odometers.
    controllers.forEach(c => c.updateLiveTimes(now));

    try {
      const feeds = controllers.map(c => new Feed(
        c.group.stop,
        departuresCount,
        new FullDepartureFilter(c.group.filter, false, false)
      ));

      const allDepartures = await fetchDepartures(
        this.apiOrigin, now, false, feeds
      );

      controllers.forEach((c, i) => {
        // Using the up-to-date network data, find this stop.
        const stop = getNetwork().requireStop(c.group.stop);

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
