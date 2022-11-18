import { Page } from "../page";
import { IndexPageHtml } from "../../bundles";
import { getPinnedDepartureGroups } from "../settings/pinned-departure-groups";
import { DepartureGroupController } from "../stop/departure-group-controller";
import { DateTime } from "luxon";
import { fetchDepartures } from "../stop/departure-request";
import { DepartureModel } from "../stop/departure-model";
import { DepartureGroup } from "../stop/departure-group";
import { initSearch, displayResults } from "../../page-template/search-ui";
import { getNetwork } from "../../utils/network";
import { searchOptionsWholeSite } from "../../page-template/search";

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

    const groups = getPinnedDepartureGroups();
    this.html.departuresParentDiv.classList.remove("loading");
    this.html.departuresParentDiv.classList.toggle("empty", groups.length < 1);

    if (groups.length > 0) {
      this.initDepartureWidgets(groups);
    }
  }

  async initDepartureWidgets(groups: DepartureGroup[]) {
    const controllers = groups.map(g => {
      const stop = getNetwork().requireStop(g.stop);
      return new DepartureGroupController(
        g, departuresCount, false, stop.name, `/${stop.urlName}`
      );
    });
    controllers.forEach(c => c.showLoading());

    // Append each departure group's div to the page.
    this.html.departuresDiv.replaceChildren(...controllers.map(c => c.groupDiv));

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
  update(controllers: DepartureGroupController[], now: DateTime) {
    // Get each group to update it's departures' live times odometers.
    controllers.forEach(c => c.updateLiveTimes(now));

    try {
      // Formulate request to api, and await its response.
      new Set(controllers.map(c => c.group.stop)).forEach(s => {
        const controllersThisStop = controllers.filter(c => c.group.stop == s);

        const filters = controllersThisStop.map(c => {
          const result = [c.group.filter, "narr", "nsdo"];
          return result.join(" ");
        });
        fetchDepartures(
          this.apiOrigin, s, now, departuresCount, false, filters
        ).then(allDepartures => {
          // Using the up-to-date network data, find this stop.
          const stop = getNetwork().requireStop(s);

          controllersThisStop.forEach((c, i) => {
            // Generate the departure models (objects that store just what is
            // displayed) for this group from the api response, and pass them to
            // the controller so it can update the UI.
            const departures = allDepartures[i];
            const models = departures.map(d =>
              new DepartureModel(d, stop)
            );
            c.showDepartures(models);
          });
        });
      });
    }
    catch {
      // If anything goes wrong show an error message inside each departure
      // group.
      controllers.forEach(c => c.showError());
    }
  }
}
