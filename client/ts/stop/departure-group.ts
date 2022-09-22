import {
  flagstaff, flindersStreet, melbourneCentral, parliament, southernCross
} from "../special-ids";

/**
 * Defines a grouping of departures as seen on a stop's main page.
 */
export type DepartureGroup = {
  filter: string,
  count: number,
  title: string,
  subtitle: string | null
};

/**
 * Returns the appropriate departures groups to use for this stop. Some stops
 * use different groups to others, e.g. the city loop stations.
 * @param stopID The stop's ID.
 */
export function getDefaultDepartureGroups(stopID: number): DepartureGroup[] {
  // Flinders Street just has one big list (unless I can think of a nicer way
  // of organizing them).
  if (stopID == flindersStreet) {
    return [
      group("", 10, "All trains", null)
    ];
  }

  // Southern Cross splits by regional vs metro.
  if (stopID == southernCross) {
    return [
      group("service-regional", 5, "Regional trains", null),
      group("service-suburban", 5, "Suburban trains", null)
    ];
  }

  // Undergroup city loop stations are split by platform.
  if ([flagstaff, melbourneCentral, parliament].includes(stopID)) {
    return [
      group("platform-1", 3, "Platform 1",
        "Hurstbridge, Mernda lines"),
      group("platform-2", 3, "Platform 2",
        "Cranbourne, Pakenham lines"),
      group("platform-3", 3, "Platform 3",
        "Craigieburn, Sunbury, Upfield lines"),
      group("platform-4", 3, "Platform 4",
        "Alamein, Belgrave, Glen Waverley, Lilydale lines")
    ];
  }

  // Every other station is split by up vs down.
  return [
    group("up", 5, "Citybound trains", null),
    group("down", 5, "Outbound trains", null)
  ];
}

/**
 * Function that creates a {@link DepartureGroup}. Just allows for shorter
 * syntax.
 */
function group(filter: string, count: number, title: string,
  subtitle: string | null): DepartureGroup {

  return { filter: filter, count: count, title: title, subtitle: subtitle };
}
