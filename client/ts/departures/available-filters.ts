import { LineService, StopID, toLineService } from "melbpt-utils";
import { unique } from "schel-d-utils";
import {
  DepartureFilter, DepartureFilterAll, DepartureFilterDown, DepartureFilterLine,
  DepartureFilterPlatform, DepartureFilterService, DepartureFilterUp
} from "./departure-filter";
import { getNetwork } from "../utils/network";
import {
  flagstaff, flindersStreet, melbourneCentral, parliament, southernCross
} from "../utils/special-ids";

/**
 * Returns a list of filtering possibilities for this stop.
 * @param stopID The stop to generate the list of filters for.
 */
export function getPossibleFilters(stopID: StopID): DepartureFilter[] {
  const result: DepartureFilter[] = [];

  // Todo: remove all these options for terminus stops where the default is
  // should be to show only outbound trains?
  result.push(new DepartureFilterAll());
  result.push(new DepartureFilterUp());
  result.push(new DepartureFilterDown());

  // Determine which lines stop here, and if there are multiple, add filtering
  // by each line as options.
  const lines = getNetwork().linesThatStopAt(stopID);
  if (lines.length > 1) {
    result.push(...lines.map(l => new DepartureFilterLine(l.id)));
  }

  // Determine whether multiple service types stop here, and if there are, add
  // filtering by each service type as options.
  const services = unique<LineService>(lines.map(l => l.service));
  if (services.length > 1) {
    result.push(...services.map(s => new DepartureFilterService(s)));
  }

  // Determine how many platforms this stop has, and if there are multiple, add
  // filtering by platform as an option.
  const platforms = getNetwork().requireStop(stopID).platforms;
  if (platforms.length > 1) {
    result.push(...platforms.map(p => new DepartureFilterPlatform(p.id)));
  }

  return result;
}

/**
 * Returns the appropriate departures groups to use for this stop. Some stops
 * use different groups to others, e.g. the city loop stations.
 * @param stopID The stop's ID.
 */
export function getDefaultDepartureGroups(stopID: StopID): DepartureFilter[] {
  // Flinders Street just has one big list (unless I can think of a nicer way
  // of organizing them).
  if (stopID == flindersStreet) {
    return [
      new DepartureFilterAll()
    ];
  }

  // Southern Cross splits by regional vs metro.
  if (stopID == southernCross) {
    return [
      new DepartureFilterService(toLineService("regional")),
      new DepartureFilterService(toLineService("suburban"))
    ];
  }

  // Undergroup city loop stations are split by platform.
  if ([flagstaff, melbourneCentral, parliament].includes(stopID)) {
    return getNetwork().requireStop(stopID).platforms.map(
      p => new DepartureFilterPlatform(p.id)
    );
  }

  // Every other station is split by up vs down.
  return [
    new DepartureFilterUp(),
    new DepartureFilterDown()
  ];
}
