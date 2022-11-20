import { domButton, domDiv, domIconify, domP } from "../../utils/dom-utils";
import { finder } from "schel-d-utils-browser";
import { StopID } from "melbpt-utils";
import { DepartureGroup } from "../../departures/departure-group";
import { getDefaultDepartureGroups, getPossibleFilters }
  from "../../departures/available-filters";
import { DepartureFilter, DepartureFilterAll, FullDepartureFilter }
  from "../../departures/departure-filter";
import { filterToPotientialSPPS, sppsToFilter }
  from "../../departures/departure-filter-encoding";
import { DepartureFilterCategory, getCategory, getGroupName }
  from "../../departures/departure-filter-names";

/**
 * Controls the content of the filter controls dropdown.
 */
export class FilterControls {
  /**
   * The current filter set on the page.
   */
  filter: DepartureFilter | null;

  /**
   * Whether the "show arrivals" option is set.
   */
  showArrivals: boolean;

  /**
   * Whether the "show V/Line trains that aren't taking passengers" option is
   * set.
   */
  showSDO: boolean;

  onSet: (closeControls: boolean) => void;

  arrivalsSwitch: HTMLInputElement;
  setDownOnlySwitch: HTMLInputElement;
  defaultButton: HTMLElement;
  allButton: HTMLElement;
  directionButton: HTMLElement;
  lineButton: HTMLElement;
  platformButton: HTMLElement;
  serviceButton: HTMLElement;
  menuDiv: HTMLElement;
  optionsDiv: HTMLElement;
  optionsBackButton: HTMLElement;
  optionsListDiv: HTMLElement;

  possibleFilters: DepartureFilter[];

  stopID: StopID;

  constructor(filterParamString: string | null,
    onModeChange: (closeControls: boolean) => void, stopID: StopID) {

    // Work out possible filters for this stop.
    this.stopID = stopID;
    this.possibleFilters = getPossibleFilters(stopID);

    // By default, the filter controls will be in "default" mode (null), with
    // all extras switched off.
    const components = sppsToFilter(filterParamString, stopID);
    this.filter = components.filter;
    this.showArrivals = components.arrivals;
    this.showSDO = components.sdo;

    // Get references to the permanent UI elements.
    this.arrivalsSwitch = finder.input("filter-controls-arrivals-switch");
    this.setDownOnlySwitch = finder.input("filter-controls-sdo-switch");
    this.defaultButton = finder.any("filter-controls-default-button");
    this.allButton = finder.any("filter-controls-all-button");
    this.directionButton = finder.any("filter-controls-direction-button");
    this.lineButton = finder.any("filter-controls-line-button");
    this.platformButton = finder.any("filter-controls-platform-button");
    this.serviceButton = finder.any("filter-controls-service-button");
    this.menuDiv = finder.any("filter-controls-menu");
    this.optionsDiv = finder.any("filter-controls-options");
    this.optionsBackButton = finder.any("filter-controls-options-back-button");
    this.optionsListDiv = finder.any("filter-controls-options-list");

    // Event listeners for the filters. Note that the switch do not have event
    // listeners, their states are only checked when the dialog is closing.
    this.defaultButton.addEventListener("click", () => {
      this.filter = null;
      this.showArrivals = this.arrivalsSwitch.checked;
      this.showSDO = this.setDownOnlySwitch.checked;
      this.onSet(true);
    });
    this.allButton.addEventListener("click", () => {
      this.filter = new DepartureFilterAll();
      this.showArrivals = this.arrivalsSwitch.checked;
      this.showSDO = this.setDownOnlySwitch.checked;
      this.onSet(true);
    });
    this.directionButton.addEventListener("click", () => {
      this.startList("direction");
    });
    this.lineButton.addEventListener("click", () => {
      this.startList("line");
    });
    this.platformButton.addEventListener("click", () => {
      this.startList("platform");
    });
    this.serviceButton.addEventListener("click", () => {
      this.startList("service");
    });
    this.optionsBackButton.addEventListener("click", () => {
      this.menuDiv.classList.remove("gone");
      this.optionsDiv.classList.add("gone");
    });

    // Save the listener to the stop page for later use.
    this.onSet = onModeChange;
  }

  /** Returns the currently active filter. */
  get fullFilter(): FullDepartureFilter | null {
    if (this.filter == null) { return null; }
    return new FullDepartureFilter(this.filter, this.showArrivals, this.showSDO);
  }

  /** Returns true if a filter is not currently set (default grouping applies). */
  get isDefault(): boolean {
    return this.filter == null;
  }

  /**
   * Called every time the filter controls are opened.
   */
  onOpened() {
    // Reset the switches to match the current filter settings.
    this.arrivalsSwitch.checked = this.showArrivals;
    this.setDownOnlySwitch.checked = this.showSDO;

    // Only show buttons for possible filters.
    const showIfCategory = ($button: HTMLElement, category: DepartureFilterCategory) => {
      const show = this.possibleFilters.some(f => getCategory(f) == category);
      $button.classList.toggle("gone", !show);
    };
    showIfCategory(this.directionButton, "direction");
    showIfCategory(this.lineButton, "line");
    showIfCategory(this.platformButton, "platform");
    showIfCategory(this.serviceButton, "service");

    this.menuDiv.classList.remove("gone");
    this.optionsDiv.classList.add("gone");
  }

  /**
   * Called every time the filter controls are closed.
   */
  onClosed() {
    // Do nothing unless the arrivals/set down only switches have been modified.
    // Note that if the switches were modified and a filter button is clicked,
    // the boolean values will already have been updated, and so onSet is not
    // called twice (which is good!).
    const changesMade = this.showArrivals != this.arrivalsSwitch.checked
      || this.showSDO != this.setDownOnlySwitch.checked;
    this.showArrivals = this.arrivalsSwitch.checked;
    this.showSDO = this.setDownOnlySwitch.checked;
    if (changesMade) {
      this.onSet(false);
    }
  }

  /**
   * Called when a type button is clicked. Changes to the list screen so the
   * user can select which filter to use.
   * @param category The filter category to show.
   */
  startList(category: DepartureFilterCategory) {
    this.menuDiv.classList.add("gone");
    this.optionsDiv.classList.remove("gone");

    this.optionsListDiv.replaceChildren();

    // Show warning if filtering by platform.
    if (category == "platform") {
      const p = domP(
        "Trains where the platform is unknown won't be shown while using " +
        "platform filtering."
      );
      const icon = domIconify("uil:info-circle");
      const note = domDiv("note");
      note.append(icon, p);
      this.optionsListDiv.append(note);
    }

    // Get the filters of this type, and sort alphabetically if the options are
    // for different lines.
    let options = this.possibleFilters.filter(f => getCategory(f) == category);
    if (category == "line") {
      options = options.sort((a, b) =>
        this._getDisplayName(a).localeCompare(this._getDisplayName(b))
      );
    }

    // Create a button for each filter option of this type, that applies the
    // filter when clicked.
    this.optionsListDiv.append(...options.map(f => {
      const p = domP(this._getDisplayName(f));

      const button = domButton("option");
      button.append(p);

      button.addEventListener("click", () => {
        this.filter = f;
        this.showArrivals = this.arrivalsSwitch.checked;
        this.showSDO = this.setDownOnlySwitch.checked;
        this.onSet(true);
      });

      return button;
    }));
  }

  /**
   * Returns the string that should be shown on the filter controls button,
   * based on the current filter set in this object.
   */
  buttonText(): string {
    return this.filter != null ? this._getDisplayName(this.filter) : "Default";
  }

  /**
   * Returns the departure groups that should be shown on the stop page based on
   * the current settings.
   */
  getDepartureGroups(): DepartureGroup[] {
    const filters = this.filter != null
      ? [this.filter]
      : getDefaultDepartureGroups(this.stopID);
    return filters.map(f => new DepartureGroup(this.stopID, f));
  }

  /**
   * Returns the string the stop page should use in the URL after `"?filter="`
   * (if any).
   */
  encodeParamString(): string | null {
    return filterToPotientialSPPS(this.filter, this.showArrivals, this.showSDO);
  }

  private _getDisplayName(filter: DepartureFilter): string {
    return getGroupName(new DepartureGroup(this.stopID, filter));
  }
}
