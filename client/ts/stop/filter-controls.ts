import {
  domButton, domDiv, domIconify, domP, getElementOrThrow, getInputOrThrow
} from "../dom-utils";
import { Network } from "../network";
import { DepartureGroup, getDefaultDepartureGroups } from "./departure-group";

type Filter = {
  id: string,
  displayName: string,
  type?: "direction" | "line" | "platform" | "service"
};

const defaultFilter: Filter = { id: "default", displayName: "Default" };
const allFilter: Filter = { id: "all", displayName: "No grouping" };

/**
 * Controls the content of the filter controls dropdown.
 */
export class FilterControls {
  /**
   * The current filter set on the page.
   */
  filter: Filter;

  /**
   * Whether the "show arrivals" option is set.
   */
  showArrivals: boolean;

  /**
   * Whether the "show V/Line trains that aren't taking passengers" option is
   * set.
   */
  showSetDownOnly: boolean;

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

  possibleFilters: Filter[];

  stopID: number;

  constructor(filterParamString: string | null,
    onModeChange: (closeControls: boolean) => void, stopID: number,
    network: Network) {

    // Work out possible filters for this stop.
    this.stopID = stopID;
    this.possibleFilters = getPossibleFilters(stopID, network);

    // By default, the filter controls will be in "default" mode, with all
    // extras switched off.
    this.filter = defaultFilter;
    this.showArrivals = false;
    this.showSetDownOnly = false;

    // Get references to the permanent UI elements.
    this.arrivalsSwitch = getInputOrThrow("filter-controls-arrivals-switch");
    this.setDownOnlySwitch = getInputOrThrow("filter-controls-sdo-switch");
    this.defaultButton = getElementOrThrow("filter-controls-default-button");
    this.allButton = getElementOrThrow("filter-controls-all-button");
    this.directionButton = getElementOrThrow("filter-controls-direction-button");
    this.lineButton = getElementOrThrow("filter-controls-line-button");
    this.platformButton = getElementOrThrow("filter-controls-platform-button");
    this.serviceButton = getElementOrThrow("filter-controls-service-button");
    this.menuDiv = getElementOrThrow("filter-controls-menu");
    this.optionsDiv = getElementOrThrow("filter-controls-options");
    this.optionsBackButton = getElementOrThrow("filter-controls-options-back-button");
    this.optionsListDiv = getElementOrThrow("filter-controls-options-list");

    // If there was no param string provided, use the default as set above.
    if (filterParamString != null) {
      this.decodeParamString(filterParamString);
    }

    // Event listeners for the filters. Note that the switch do not have event
    // listeners, their states are only checked when the dialog is closing.
    this.defaultButton.addEventListener("click", () => {
      this.filter = defaultFilter;
      this.showArrivals = this.arrivalsSwitch.checked;
      this.showSetDownOnly = this.setDownOnlySwitch.checked;
      this.onSet(true);
    });
    this.allButton.addEventListener("click", () => {
      this.filter = allFilter;
      this.showArrivals = this.arrivalsSwitch.checked;
      this.showSetDownOnly = this.setDownOnlySwitch.checked;
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

  /**
   * Called every time the filter controls are opened.
   */
  onOpened() {
    // Reset the switches to match the current filter settings.
    this.arrivalsSwitch.checked = this.showArrivals;
    this.setDownOnlySwitch.checked = this.showSetDownOnly;

    // Only show buttons for possible filters.
    this.allButton.classList.toggle("gone",
      !this.possibleFilters.includes(allFilter));
    this.directionButton.classList.toggle("gone",
      !this.possibleFilters.some(f => f.type == "direction"));
    this.lineButton.classList.toggle("gone",
      !this.possibleFilters.some(f => f.type == "line"));
    this.platformButton.classList.toggle("gone",
      !this.possibleFilters.some(f => f.type == "platform"));
    this.serviceButton.classList.toggle("gone",
      !this.possibleFilters.some(f => f.type == "service"));

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
      || this.showSetDownOnly != this.setDownOnlySwitch.checked;
    this.showArrivals = this.arrivalsSwitch.checked;
    this.showSetDownOnly = this.setDownOnlySwitch.checked;
    if (changesMade) {
      this.onSet(false);
    }
  }

  /**
   * Called when a type button is clicked. Changes to the list screen so the
   * user can select which filter to use.
   * @param type The filter types to show.
   */
  startList(type: "direction" | "line" | "service" | "platform") {
    this.menuDiv.classList.add("gone");
    this.optionsDiv.classList.remove("gone");

    this.optionsListDiv.replaceChildren();

    // Show warning if filtering by platform.
    if (type == "platform") {
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
    let options = this.possibleFilters.filter(f => f.type == type);
    if (type == "line") {
      options = options.sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      );
    }

    // Create a button for each filter option of this type, that applies the
    // filter when clicked.
    this.optionsListDiv.append(...options.map(f => {
      const p = domP(f.displayName);

      const button = domButton("option");
      button.append(p);

      button.addEventListener("click", () => {
        this.filter = f;
        this.showArrivals = this.arrivalsSwitch.checked;
        this.showSetDownOnly = this.setDownOnlySwitch.checked;
        this.onSet(true);
      });

      return button;
    }));
  }

  /**
   * Returns the string to be used in the url bar for the current state of the
   * filter controls.
   */
  encodeParamString(): string | null {
    const filters = [];
    if (this.filter.id != "default") {
      filters.push(this.filter.id);
    }
    if (this.showArrivals) {
      filters.push("arr");
    }
    if (this.showSetDownOnly) {
      filters.push("sdo");
    }
    if (filters.length == 0) {
      return null;
    }
    return filters.join(" ");
  }

  /**
   * Takes a string from the url params and sets {@link this.filter},
   * {@link this.showArrivals} and {@link this.showSetDownOnly} based on it's
   * value.
   * @param filterParamString The string in the url parameters for "filter".
   */
  decodeParamString(filterParamString: string) {
    const clauses = filterParamString.split(" ");

    const filterIDs = clauses.filter(c => c != "arr" && c != "sdo");
    if (filterIDs.length != 1) {
      this.filter = defaultFilter;
    }
    else {
      const filter = this.possibleFilters.find(f => f.id == filterIDs[0]);
      this.filter = filter ?? defaultFilter;
    }

    this.showArrivals = clauses.includes("arr");
    this.showSetDownOnly = clauses.includes("sdo");
  }

  /**
   * Returns the string that should be shown on the filter controls button,
   * based on the current filter set in this object.
   */
  buttonText(): string {
    return this.filter.displayName;
  }

  getDepartureGroups(): DepartureGroup[] {
    if (this.filter.id == "default") {
      return getDefaultDepartureGroups(this.stopID);
    }
    else if (this.filter.id == "all") {
      return [{ filter: "", count: 10, title: "All trains", subtitle: null }];
    }
    else {
      return [{
        filter: this.filter.id, count: 10, title: "Filtered trains",
        subtitle: this.filter.displayName
      }];
    }
  }
}

/**
 * Returns a list of filtering possibilities for this stop.
 * @param stopID The stop to generate the list of filters for.
 */
function getPossibleFilters(stopID: number, network: Network): Filter[] {
  const result: Filter[] = [];
  result.push(defaultFilter);

  // Todo: remove all these options for terminus stops where the default is
  // should be to show only outbound trains?
  result.push(allFilter);
  result.push({
    id: "up", type: "direction", displayName: "Citybound trains"
  });
  result.push({
    id: "down", type: "direction", displayName: "Outbound trains"
  });

  // Determine which lines stop here, and if there are multiple, add filtering
  // by each line as options.
  const lines = network.lines.filter(l =>
    l.directions.some(d => d.stops.includes(stopID))
  );
  if (lines.length > 1) {
    lines.forEach(l =>
      result.push({
        id: `line-${l.id.toFixed()}`, type: "line",
        displayName: `${l.name} line`
      })
    );
  }

  // Determine whether multiple service types stop here, and if there are, add
  // filtering by each service type as options.
  const services = [];
  if (lines.some(l => l.service == "suburban")) { services.push("suburban"); }
  if (lines.some(l => l.service == "regional")) { services.push("regional"); }
  if (services.length > 1) {
    services.forEach(s =>
      result.push({
        id: `service-${s}`, type: "service",
        displayName: s == "regional" ? "Regional trains" : "Suburban trains"
      })
    );
  }

  // Determine how many platforms this stop has, and if there are multiple, add
  // filtering by platform as an option.
  const stop = network.stops.find(s => s.id == stopID);
  if (stop == null) { throw new Error("Stop not found."); }
  if (stop.platforms.length > 1) {
    stop.platforms.forEach(p =>
      result.push({
        id: `platform-${p.id}`, type: "platform",
        displayName: `Platform ${p.name}`
      })
    );
  }

  return result;
}
