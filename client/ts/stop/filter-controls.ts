import { getInputOrThrow } from "../dom-utils";
import { getNetwork, Network } from "../network";

type Filter = {
  id: string,
  displayName?: string,
  type?: "direction" | "line" | "platform" | "service",
  direction?: string,
  line?: number,
  platform?: string,
  service?: string
};

/**
 * Controls the content of the filter controls dropdown.
 */
export class FilterControls {
  /**
   * The current filter set on the page.
   */
  filter: string;

  /**
   * Whether the "show arrivals" option is set.
   */
  showArrivals: boolean;

  /**
   * Whether the "show V/Line trains that aren't taking passengers" option is
   * set.
   */
  showSetDownOnly: boolean;

  onSet: () => void;

  arrivalsSwitch: HTMLInputElement;
  setDownOnlySwitch: HTMLInputElement;

  possibleFilters: Filter[];

  constructor(filterParamString: string | null, onModeChange: () => void,
    stopID: number, network: Network) {

    // Save the previously generated filtering possibilities for this stop.
    this.possibleFilters = getPossibleFilters(stopID, network);

    // By default, the filter controls will be in "default" mode, with all
    // extras switched off.
    this.filter = "default";
    this.showArrivals = false;
    this.showSetDownOnly = false;

    // Get references to the permanent UI elements.
    this.arrivalsSwitch = getInputOrThrow("filter-controls-arrivals-switch");
    this.setDownOnlySwitch = getInputOrThrow("filter-controls-sdo-switch");

    // If there was no param string provided, use the default as set above.
    if (filterParamString != null) {
      this.decodeParamString(filterParamString);
    }

    // Todo: setup event listeners

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

    // Todo: go back to menu view (with the large buttons).
  }

  /**
   * Returns the string to be used in the url bar for the current state of the
   * filter controls.
   */
  encodeParamString(): string | null {
    // const filters = [];
    // if (this.filter != "default") {
    //   filters.push(this.filter);
    // }
    // if (this.arrivalsSwitch) {
    //   filters.push("arr");
    // }
    // if (this.setDownOnlySwitch) {
    //   filters.push("sdo");
    // }
    // if (filters.length == 0) {
    //   return null;
    // }
    // return filters.join(" ");
    return null;
  }

  /**
   * Takes a string from the url params and sets {@link this.filter},
   * {@link this.showArrivals} and {@link this.showSetDownOnly} based on it's
   * value.
   * @param filterParamString The string in the url parameters for "filter".
   */
  decodeParamString(filterParamString: string) {
    // const filters = filterParamString.split(" ").map(s => s.trim())
    //   .filter(s => s.length != 0);

    // // Values to use unless told otherwise in the filter strings.
    // this.filter = "default";
    // this.showArrivals = false;
    // this.showSetDownOnly = false;

    // // Go through each filter string.
    // for (let i = 0; i < filters.length; i++) {
    //   const filter = filters[i];
    //   if (filter == "arr") {
    //     this.showArrivals = true;
    //   }
    //   if (filter == "sdo") {
    //     this.showSetDownOnly = true;
    //   }

    //   // Only use the use filter candidate if multiple are present, hence the
    //   // check for whether filter is still "default" at this point.
    //   if (this.filter == "default" && (filter == "all"
    //     || filter.startsWith("direction-")
    //     || filter.startsWith("line-")
    //     || filter.startsWith("platform-")
    //     || filter.startsWith("type-"))) {

    //     this.filter = filter;
    //   }
    // }
  }

  /**
   * Returns the string that should be shown on the filter controls button,
   * based on the current filter set in this object.
   */
  buttonText(): string {
    return "Something";
  }
}

/**
 * Returns a list of filtering possibilities for this stop.
 * @param stopID The stop to generate the list of filters for.
 */
function getPossibleFilters(stopID: number, network: Network): Filter[] {
  const result: Filter[] = [];
  result.push({ id: "default", displayName: "Default" });

  // Todo: remove this option for stops where trains never terminate?
  result.push({ id: "narr" });

  // Todo: remove this option for stops where V/Line trains can be set down
  // only?
  result.push({ id: "nsdo" });

  // Todo: remove these options for terminus stops where the default is should
  // be to show only outbound trains?
  result.push({
    id: "all", displayName: "No grouping"
  });
  result.push({
    id: "up", type: "direction", direction: "up",
    displayName: "Citybound trains"
  });
  result.push({
    id: "down", type: "direction", direction: "down",
    displayName: "Outbound trains"
  });

  // Determine which lines stop here, and if there are multiple, add filtering
  // by each line as options.
  const lines = network.lines.filter(l =>
    l.directions.some(d => d.stops.includes(stopID))
  );
  if (lines.length > 1) {
    lines.forEach(l =>
      result.push({
        id: `line-${l.id.toFixed()}`, type: "line", line: l.id,
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
        id: `service-${s}`, type: "service", service: s,
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
        id: `platform-${p.id}`, type: "platform", platform: p.id,
        displayName: `Platform ${p.name}`
      })
    );
  }

  return result;
}
