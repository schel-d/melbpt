import { getNetwork } from "../utils/network";
import { flagstaff, melbourneCentral, parliament } from "../utils/special-ids";
import {
  DepartureFilter, DepartureFilterAll, DepartureFilterDirection,
  DepartureFilterDown, DepartureFilterLine, DepartureFilterPlatform,
  DepartureFilterService, DepartureFilterUp
} from "./departure-filter";
import { DepartureGroup } from "./departure-group";

/**
 * Returns a user-friendly string that describes this departure group.
 * @param group The departure group.
 */
export function getGroupName(group: DepartureGroup): string {
  if (group.filter instanceof DepartureFilterAll) {
    return "All trains";
  }
  if (group.filter instanceof DepartureFilterUp) {
    return "Citybound trains";
  }
  if (group.filter instanceof DepartureFilterDown) {
    return "Outbound trains";
  }
  if (group.filter instanceof DepartureFilterLine) {
    const lineName = getNetwork().requireLine(group.filter.line).name;
    return `${lineName} line`;
  }
  if (group.filter instanceof DepartureFilterPlatform) {
    const platformName = getNetwork().requireStop(group.stop)
      .requirePlatform(group.filter.platform).name;
    return `Platform ${platformName}`;
  }
  if (group.filter instanceof DepartureFilterService) {
    return {
      "suburban": "Suburban trains",
      "regional": "Regional trains"
    }[group.filter.service];
  }

  return "Advanced filter";
}

/**
 * Returns an optional user-friendly description string that provides further
 * information about this departure group beyond {@link getGroupName}.
 * @param group The departure group.
 */
export function getGroupDescription(group: DepartureGroup): string | null {
  if (group.filter instanceof DepartureFilterPlatform
    && [flagstaff, melbourneCentral, parliament].includes(group.stop)) {

    if (group.filter.platform == "1") {
      return "Hurstbridge, Mernda lines";
    }
    if (group.filter.platform == "2") {
      return "Cranbourne, Pakenham lines";
    }
    if (group.filter.platform == "3") {
      return "Craigieburn, Sunbury, Upfield lines";
    }
    if (group.filter.platform == "4") {
      return "Alamein, Belgrave, Glen Waverley, Lilydale lines";
    }
  }

  return null;
}

/** A filter category. Note that not all filters fit these categories. */
export type DepartureFilterCategory =
  "direction" | "line" | "platform" | "service";

/**
 * Returns a {@link DepartureFilterCategory} that matches the given filter, or
 * null if none apply.
 * @param filter The filter to categorize.
 */
export function getCategory(
  filter: DepartureFilter): DepartureFilterCategory | null {

  if (filter instanceof DepartureFilterUp
    || filter instanceof DepartureFilterDown
    || filter instanceof DepartureFilterDirection) {
    return "direction";
  }
  if (filter instanceof DepartureFilterLine) {
    return "line";
  }
  if (filter instanceof DepartureFilterPlatform) {
    return "platform";
  }
  if (filter instanceof DepartureFilterService) {
    return "service";
  }
  return null;
}
