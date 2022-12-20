import { domA, domDiv, domIcon, domP } from "../utils/dom-utils";
import { createDepartureGroup } from "./departure-group-div";
import { DepartureModel } from "./departure-model";
import { DateTime } from "luxon";
import { createDepartureDiv, departureHeightRem } from "./departure-div";
import { minsDelta } from "../utils/time-utils";
import { createLoadingSpinner } from "../utils/loading-spinner";
import { OdometerController } from "schel-d-utils-browser";
import { DepartureGroup } from "./departure-group";
import { getGroupDescription, getGroupName } from "./departure-filter-names";
import { getNetwork } from "../utils/network";
import { filterToSPPS } from "./departure-filter-encoding";
import { DepartureFilterAll } from "./departure-filter";
import { canPinMore, isPinned, setPinned } from "../settings/pinned-widgets";

/**
 * Controls the UI for each departure group.
 */
export class DepartureGroupController {
  /** The departure group information (title, filter string, etc.). */
  readonly group: DepartureGroup;

  /** The div created in the constructor that should be appended to the page. */
  readonly $groupDiv: HTMLDivElement;

  /** How many departures to display. */
  private readonly _count: number;

  /** A reference to the div that departures will be stored in. */
  private readonly _$departuresListDiv: HTMLDivElement;

  /** The current departure models being shown on the UI. */
  private _models: DepartureModel[];

  /**
   * The divs which house the odometers, which themselves house the departure
   * info. This div is the one that acts as the button, and so has to be stored
   * so the link href can be updated when the models are updated.
   */
  private _$departureDivs: HTMLAnchorElement[];

  /**
   * The odometer controllers for each entire departure (not just the live time
   * bit). Odometers are used for theres a nice transition when the departure
   * at the top of the list departs.
   */
  private _departureOdometers: OdometerController<DepartureModel | null>[];

  /** The odometer controllers for the live time sections of each departure. */
  private _liveTimeOdometers: (OdometerController<number> | null)[];

  /** The pin button, which may not be present (e.g. on the index page). */
  private _$pinButton: HTMLButtonElement | null;

  /**
   * Callback that gets the whole list of controllers on the page. Used when the
   * pin button is toggled to disable other pins if the limit has been reached.
   * This controller should be included in the list returned.
   */
  private _getControllerSet: () => DepartureGroupController[];

  /**
   * Creates a new departure group controller.
   * @param group The group information (title, filter string, etc.).
   * @param count How many departures to display.
   * @param getControllerSet Callback that gets the whole list of controllers on
   * the page. Used when the pin button is toggled to disable other pins if the
   * limit has been reached. This controller should be included in the list
   * returned.
   */
  constructor(group: DepartureGroup, count: number, enablePinButton: boolean,
    titles: DepartureGroupControllerTitles,
    getControllerSet: () => DepartureGroupController[]) {

    this.group = group;
    this._count = count;

    // Create the UI for the departure group.
    const ui = createDepartureGroup(titles, this._count, enablePinButton);
    this.$groupDiv = ui.groupDiv;
    this._$departuresListDiv = ui.departuresListDiv;

    // Everything starts empty.
    this._models = [];
    this._$departureDivs = [];
    this._departureOdometers = [];
    this._liveTimeOdometers = [];

    this._getControllerSet = getControllerSet;

    this._$pinButton = ui.pinButton;
    if (this._$pinButton != null) {
      this.setupPinButton(this._$pinButton);
    }
  }

  /**
   * Checks the pin button if appropriate, and attaches the event listener for
   * when it's clicked.
   */
  setupPinButton(pinButton: HTMLButtonElement) {
    // Todo: this button behaves like a checkbox, and so should probably be one.

    // Give the button the correct class depending on whether this group is
    // pinned.
    pinButton.classList.toggle("checked", isPinned(this.group));

    // When the pin button is clicked, toggle the checked class and either add
    // or remove the group from the pinned list.
    pinButton.addEventListener("click", () => {
      pinButton.classList.toggle("checked");
      const checked = pinButton.classList.contains("checked");
      setPinned(this.group, checked);

      // Inform other controllers on the page they may need to disable/enable
      // their pin buttons (if the max limit has been reached).
      this._getControllerSet().forEach(c => c.updatePinButtonEnabled());
    });

    this.updatePinButtonEnabled();
  }

  /** Updates the enabled status of the pin button if appropriate. */
  updatePinButtonEnabled() {
    if (this._$pinButton == null) { return; }

    // Enable the button if the limit hasn't been reached, or it's already
    // pinned (so it's possible to unpin once we reach the limit).
    const enable = canPinMore() || isPinned(this.group);
    this._$pinButton.disabled = !enable;
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
    this._$departureDivs.forEach((d, i) => {
      const url = this._models[i]?.serviceUrl ?? null;
      if (url != null) {
        d.href = url;
      }
      else {
        d.removeAttribute("href");
      }
    });
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
    this._$departuresListDiv.replaceChildren(spinner);
  }

  /**
   * Replaces the content of the departures list UI with an error message.
   */
  showError() {
    this._models = [];

    const icon = domIcon("uil:exclamation-triangle");
    const messageP = domP("Something went wrong");
    const messageDiv = domDiv("message error");
    messageDiv.append(icon, messageP);

    this._$departuresListDiv.replaceChildren(messageDiv);
  }

  /**
   * Replaces the content of the departures list UI with an message saying
   * there's no trains scheduled.
   */
  private _showEmpty() {
    this._models = [];

    const icon = domIcon("uil:calendar-slash");
    const messageP = domP("No trains scheduled");
    const messageDiv = domDiv("message");
    messageDiv.append(icon, messageP);

    this._$departuresListDiv.replaceChildren(messageDiv);
  }

  /**
   * Create the odometers for the departures. Initial values will be what is
   * currently in the {@link _models} array.
   */
  private _createOdometers() {
    // Clear lists.
    this._$departureDivs = [];
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
      departureDiv.append(odometer.$div);

      // Keep a reference to the div and odometer for later.
      this._departureOdometers.push(odometer);
      this._$departureDivs.push(departureDiv);
    }

    // Show the departure divs (the buttons containing the odometers) in the
    // list.
    this._$departuresListDiv.replaceChildren(...this._$departureDivs);
  }
}

/** The titles to use on the {@link DepartureGroupController}. */
export class DepartureGroupControllerTitles {
  /** The group title. */
  readonly title: string;

  /** If present, makes the group title a link to this URL. */
  readonly titleLink: string | null;

  /** Optional group subtitle. */
  readonly subtitle: string | null;

  /** Like {@link titleLink} but the subtitle. Ignored if subtitle is null. */
  readonly subtitleLink: string | null;

  /**
   * Creates a {@link DepartureGroupControllerTitles}.
   * @param title The group title.
   * @param titleLink If present, makes the group title a link to this URL.
   * @param subtitle Optional group subtitle.
   * @param subtitleLink Like {@link titleLink} but the subtitle. Ignored if
   * subtitle is null.
   */
  constructor(title: string, titleLink: string | null, subtitle: string | null,
    subtitleLink: string | null) {

    this.title = title;
    this.titleLink = titleLink;
    this.subtitle = subtitle;
    this.subtitleLink = subtitleLink;
  }

  /**
   * Creates the {@link DepartureGroupControllerTitles} for pinned widgets.
   * @param group The departure group.
   */
  static pinnedWidgets(group: DepartureGroup): DepartureGroupControllerTitles {
    const stop = getNetwork().requireStop(group.stop);
    const spps = filterToSPPS(group.filter, false, false);

    return new DepartureGroupControllerTitles(
      stop.name,
      `/${stop.urlName}`,
      getGroupName(group),
      `/${stop.urlName}?filter=${encodeURIComponent(spps)}`
    );
  }

  /**
   * Creates the {@link DepartureGroupControllerTitles} for pinned widgets.
   * @param group The departure group.
   * @param isDefault True if no filters are set on the stop page.
   */
  static stopPage(group: DepartureGroup,
    isDefault: boolean): DepartureGroupControllerTitles {

    if (isDefault || group.filter instanceof DepartureFilterAll) {
      return new DepartureGroupControllerTitles(
        getGroupName(group),
        null,
        getGroupDescription(group),
        null
      );
    }

    return new DepartureGroupControllerTitles(
      "Filtered trains",
      null,
      getGroupName(group),
      null
    );
  }
}
