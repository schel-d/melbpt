import { StopID } from "melbpt-utils";
import { getNetwork } from "../utils/network";
import { DepartureFilter, DepartureFilterAll, FullDepartureFilter }
  from "./departure-filter";

/**
 * Converts the filter to a string used by the departures API.
 * @param filter The filter (including the arrivals and set down only flag).
 */
export function filterToApiString(filter: FullDepartureFilter): string | null {
  const result = filter.filter instanceof DepartureFilterAll
    ? []
    : [filter.filter.toString()];
  if (!filter.arrivals) { result.push("narr"); }
  if (!filter.sdo) { result.push("nsdo"); }

  if (result.length == 0) { return null; }
  return result.join(" ");
}

/**
 * Converts the filter to the stop page's params string.
 * @param filter The filter.
 * @param arrivals If true, appends "arr".
 * @param sdo If true, appends "sdo".
 */
export function filterToSPPS(filter: DepartureFilter, arrivals: boolean,
  sdo: boolean): string {

  const result = [filter.toString()];
  if (arrivals) { result.push("arr"); }
  if (sdo) { result.push("sdo"); }

  return result.join(" ");
}

/**
 * Converts the filter to the stop page's params string.
 * @param filter The filter (or null if default grouping mode is set).
 * @param arrivals If true, appends "arr".
 * @param sdo If true, appends "sdo".
 */
export function filterToPotientialSPPS(filter: DepartureFilter | null,
  arrivals: boolean, sdo: boolean): string | null {

  return filter == null ? null : filterToSPPS(filter, arrivals, sdo);
}

/**
 * Converts a stop page's params string to a filter. The filter field will be
 * null if the filter is invalid or not present (default grouping mode).
 * @param spps The value after `"?filter="` in the stop page's url.
 */
export function sppsToFilter(spps: string | null, stop: StopID) {
  const pieces = spps?.split(" ") ?? [];
  const arrivals = pieces.includes("arr");
  const sdo = pieces.includes("sdo");
  const others = pieces.filter(p => p != "arr" && p != "sdo");

  if (others.length != 1) {
    return {
      filter: null,
      arrivals: arrivals,
      sdo: sdo
    };
  }

  const filter = DepartureFilter.fromStringOrNull(others[0]);

  if (filter != null && !filter.isValid(getNetwork(), stop)) {
    return {
      filter: null,
      arrivals: arrivals,
      sdo: sdo
    };
  }

  return {
    filter: filter,
    arrivals: arrivals,
    sdo: sdo
  };
}
