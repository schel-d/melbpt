import { domA, domDiv, domIconify, domP } from "../../utils/dom-utils";
import { DepartureGroup } from "./departure-group";
import { createDepartureGroup } from "./departure-group-div";
import { DepartureModel } from "./departure-model";
import { OdometerController } from "../../utils/odometer";
import { DateTime } from "luxon";
import { createDepartureDiv, departureHeightRem } from "./departure-div";
import { minsDelta } from "../../utils/time-utils";
import { createLoadingSpinner } from "../../utils/loading-spinner";
import {
  getPinnedDepartureGroups, isPinned, savePinnedDepartureGroups
} from "../settings/pinned-departure-groups";
import { getStopName } from "../../utils/network-utils";
import { getNetwork } from "../../utils/network";

/**
 * Controls the UI for each departure group.
 */
export class DepartureGroupController {
  /**
   * The departure group information (title, filter string, etc.).
   */
  group: DepartureGroup;

  /**
   * The div created in the constructor that should be appended to the page.
   */
  groupDiv: HTMLDivElement;

  /**
   * How many departures to display.
   */
  private _count: number;

  /**
   * A reference to the div that departures will be stored in.
   */
  private _departuresListDiv: HTMLDivElement;

  /**
   * The current departure models being shown on the UI.
   */
  private _models: DepartureModel[];

  /**
   * The divs which house the odometers, which themselves house the departure
   * info. This div is the one that acts as the button, and so has to be stored
   * so the link href can be updated when the models are updated.
   */
  private _departureDivs: HTMLAnchorElement[];

  /**
   * The odometer controllers for each entire departure (not just the live time
   * bit). Odometers are used for theres a nice transition when the departure
   * at the top of the list departs.
   */
  private _departureOdometers: OdometerController<DepartureModel | null>[];

  /**
   * The odometer controllers for the live time sections of each departure.
   */
  private _liveTimeOdometers: (OdometerController<number> | null)[];

  /**
   * Creates a new departure group controller.
   * @param group The group information (title, filter string, etc.).
   */
  constructor(group: DepartureGroup, count: number, enableFavButton: boolean,
    overrideTitle: string | null) {

    this.group = group;
    this._count = count;

    // Create the UI for the departure group.
    const title = overrideTitle ?? group.title;
    const subtitle = overrideTitle == null ? group.subtitle : group.singleTitle;
    const ui = createDepartureGroup(title, subtitle, this._count, enableFavButton);
    this.groupDiv = ui.groupDiv;
    this._departuresListDiv = ui.departuresListDiv;

    // Everything starts empty.
    this._models = [];
    this._departureDivs = [];
    this._departureOdometers = [];
    this._liveTimeOdometers = [];

    const favButton = ui.favButton;
    if (favButton != null) {
      this.setupFavButton(favButton);
    }
  }

  /**
   * Checks the fav button if appropriate, and attaches the event listener for
   * when it's clicked.
   */
  setupFavButton(favButton: HTMLButtonElement) {
    // Todo: this button behaves like a checkbox, and so should probably be one.

    // Give the button the correct class depending on whether this group is
    // pinned.
    const pinned = isPinned(this.group);
    favButton.classList.toggle("checked", pinned);

    // When the fav button is clicked, toggle the checked class and either add
    // or remove the group from the pinned list.
    favButton.addEventListener("click", () => {
      favButton.classList.toggle("checked");
      const checked = favButton.classList.contains("checked");
      if (checked) {
        savePinnedDepartureGroups([...getPinnedDepartureGroups(), this.group]);
      }
      else {
        savePinnedDepartureGroups(
          getPinnedDepartureGroups().filter(x => !x.sameStopAndFilter(this.group))
        );
      }
    });
  }

  /**
   * Called when new departure models are available, and should be displayed in
   * the UI.
   * @param newModels The new departure models to display.
   */
  showDepartures(newModels: DepartureModel[]) {
    // If there's no error, but also no departures to show, show a message
    // saying there's no trains scheduled.
    if (newModels.length == 0) {
      this._showEmpty();
      return;
    }

    // Take note of whether the UI was already displaying departures.
    const hadModels = this._models.length != 0;
    this._models = newModels;

    if (newModels.length != 0 && !hadModels) {
      // Only recreate the UI if we now have departures to show, and didn't
      // before.
      this._createOdometers();
    }
    else {
      // Otherwise just update the odometer's values.
      this._departureOdometers.forEach((d, i) =>
        d.update(this._models[i] ?? null)
      );
    }

    // Regardless, the links on the buttons (which house the odometers) will
    // need updating.
    this._departureDivs.forEach((d, i) =>
      d.href = this._models[i]?.serviceUrl ?? null);
  }

  /**
   * Called at the start of each minute (regardless of whether new models are
   * available).
   * @param now The minute that just began.
   */
  updateLiveTimes(now: DateTime) {
    this._liveTimeOdometers.forEach((d, i) => {
      if (d == null) { return; }
      d.update(minsDelta(this._models[i].timeUTC, now));
    });
  }

  /**
   * Replaces the content of the departures list UI with a loading spinner.
   */
  showLoading() {
    this._models = [];
    const spinner = createLoadingSpinner("loading-spinner");
    this._departuresListDiv.replaceChildren(spinner);
  }

  /**
   * Replaces the content of the departures list UI with an error message.
   */
  showError() {
    this._models = [];

    const icon = domIconify("uil:exclamation-triangle");
    const messageP = domP("Something went wrong");
    const messageDiv = domDiv("message error");
    messageDiv.append(icon, messageP);

    this._departuresListDiv.replaceChildren(messageDiv);
  }

  /**
   * Replaces the content of the departures list UI with an message saying
   * there's no trains scheduled.
   */
  private _showEmpty() {
    this._models = [];

    const icon = domIconify("uil:calendar-slash");
    const messageP = domP("No trains scheduled");
    const messageDiv = domDiv("message");
    messageDiv.append(icon, messageP);

    this._departuresListDiv.replaceChildren(messageDiv);
  }

  /**
   * Create the odometers for the departures. Initial values will be what is
   * currently in the {@link _models} array.
   */
  private _createOdometers() {
    // Clear lists.
    this._departureDivs = [];
    this._departureOdometers = [];
    this._liveTimeOdometers = [];

    // For 0..this.group.count...
    // Note that there may be less departures available than this.group.count,
    // which is why these odometers we're about to create can have null.
    for (let i = 0; i < this._count; i++) {
      // Create the odometer (a reminder that this is for the entire
      // departure, not just the live time bit).
      const odometer = new OdometerController<DepartureModel | null>(
        // Retrieve the model for this index (can be null if the group count
        // is more than the available number of departures)
        this._models[i] ?? null,

        // Equal if neither is null and a equals b or if neither is null.
        (a, b) => (a != null && b != null && a.equals(b)) ||
          (a == null && b == null),

        // Function to create the departure div.
        (model) => {
          // Time queried on the fly here, since this function will be called
          // later too and will need the current time, not the time this
          // function was created!
          const now = DateTime.utc().startOf("minute");

          if (model == null) {
            // If there's no model for this slot, make it an empty div!
            // Maybe a loading spinner could be shown here instead?
            this._liveTimeOdometers[i] = null;
            return document.createElement("div");
          }
          else {
            // Otherwise create the UI for the departure!
            const departureInnerDiv = createDepartureDiv(model, now);
            this._liveTimeOdometers[i] = departureInnerDiv.liveTimeOdometer;
            return departureInnerDiv.departureDiv;
          }
        },

        // Animate the first set of departures (of course every set afterwards
        // is also animated - that's the whole point).
        true
      );

      // Create the div which houses the odometer. Note that this div is a
      // button and the link will need updating each time new departures are
      // provided.
      const departureDiv = domA("#", "departure");
      departureDiv.style.height = `${departureHeightRem}rem`;
      departureDiv.append(odometer.div);

      // Keep a reference to the div and odometer for later.
      this._departureOdometers.push(odometer);
      this._departureDivs.push(departureDiv);
    }

    // Show the departure divs (the buttons containing the odometers) in the
    // list.
    this._departuresListDiv.replaceChildren(...this._departureDivs);
  }
}
