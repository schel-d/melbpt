import { z } from "zod";
import {
  flagstaff, flindersStreet, melbourneCentral, parliament, southernCross
} from "../../utils/special-ids";

/**
 * Defines a grouping of departures as seen on a stop's main page.
 */
export class DepartureGroup {
  stop: number;
  filter: string;
  title: string;
  subtitle: string | null;

  static json = z.object({
    stop: z.number().int(),
    filter: z.string(),
    title: z.string(),
    subtitle: z.string().nullable()
  });

  constructor(stop: number, filter: string, title: string, subtitle: string | null) {
    this.stop = stop;
    this.filter = filter;
    this.title = title;
    this.subtitle = subtitle;
  }

  sameStopAndFilter(other: DepartureGroup) {
    return this.stop == other.stop && this.filter == other.filter;
  }

  static fromJson(json: unknown): DepartureGroup {
    const obj = DepartureGroup.json.parse(json);
    return new DepartureGroup(obj.stop, obj.filter, obj.title, obj.subtitle);
  }
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
      group(stopID, "", "All trains", null)
    ];
  }

  // Southern Cross splits by regional vs metro.
  if (stopID == southernCross) {
    return [
      group(stopID, "service-regional", "Regional trains", null),
      group(stopID, "service-suburban", "Suburban trains", null)
    ];
  }

  // Undergroup city loop stations are split by platform.
  if ([flagstaff, melbourneCentral, parliament].includes(stopID)) {
    return [
      group(stopID, "platform-1", "Platform 1",
        "Hurstbridge, Mernda lines"),
      group(stopID, "platform-2", "Platform 2",
        "Cranbourne, Pakenham lines"),
      group(stopID, "platform-3", "Platform 3",
        "Craigieburn, Sunbury, Upfield lines"),
      group(stopID, "platform-4", "Platform 4",
        "Alamein, Belgrave, Glen Waverley, Lilydale lines")
    ];
  }

  // Every other station is split by up vs down.
  return [
    group(stopID, "up", "Citybound trains", null),
    group(stopID, "down", "Outbound trains", null)
  ];
}

/**
 * Function that creates a {@link DepartureGroup}. Just allows for shorter
 * syntax.
 */
function group(stop: number, filter: string, title: string,
  subtitle: string | null): DepartureGroup {

  return new DepartureGroup(stop, filter, title, subtitle);
}
