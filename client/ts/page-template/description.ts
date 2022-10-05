import { Network, getNetwork } from "../utils/network";
import {
  flagstaff, flindersStreet, melbourneCentral, parliament,
  southernCross
} from "../utils/special-ids";

/**
 * Returns a description for the given stop that can be used in search results.
 * @param stopID The stop's ID.
 */
export function stopDescription(stopID: number) {
  // Some stops have custom descriptions.
  const customDescriptions = [
    { stop: flindersStreet, description: "Suburban train hub" },
    { stop: southernCross, description: "Regional train hub" },
    { stop: flagstaff, description: "Underground city loop station" },
    { stop: melbourneCentral, description: "Underground city loop station" },
    { stop: parliament, description: "Underground city loop station" }
  ];

  // If this is one of those stops, then return it.
  const customDescription = customDescriptions.find(e => e.stop == stopID);
  if (customDescription != null) {
    return customDescription.description;
  }

  // Otherwise, create a list of the lines that stop here. Just get their
  // names, and sort them alphabetically. Do not count special events only lines
  // in this list (unless they're the only lines that stop here), since they
  // only run occasionally.
  const lines = getNetwork().lines.filter(
    l => l.directions.some(d => d.stops.includes(stopID))
  );
  const appropriateLines = lines.length == 1
    ? lines
    : lines.filter(l => !l.specialEventsOnly);
  const lineNames = appropriateLines
    .map(l => l.name)
    .sort((a, b) => a.localeCompare(b));

  if (lineNames.length == 0) {
    // If no lines stop here, get really confused I guess? This will likely
    // never be shown to the user in reality.
    return "No train lines?";
  }
  if (lineNames.length <= 4) {
    // If there's 4 or fewer, just list them, e.g. "Pakenham, Cranbourne lines".
    const linesStr = lineNames.join(", ");
    return `${linesStr} ${pluralize(lineNames.length, "line", " lines")}`;
  }

  // If there's more than 4, list the first 4, then add " + x lines" for the
  // extra ones, e.g. "Ballarat, Bendigo, Geelong, Sunbury + 2 lines".
  const firstFour = lineNames.slice(0, 4).join(", ");
  const numExtra = lineNames.length - 4;
  return `${firstFour} + ${numExtra} ${pluralize(numExtra, "line", "lines")}`;
};

/**
 * Returns a description of the given line that can be used in search.
 * @param lineID The line ID.
 * @param service The line's service type.
 * @param color The line's color.
 */
export function lineDescription(lineID: number,
  service: "suburban" | "regional", color: "red" | "yellow" | "green" | "cyan" |
    "blue" | "purple" | "pink" | "grey", specialEventsOnly: boolean): string {

  if (specialEventsOnly) {
    if (service == "suburban") {
      return "Suburban train line, special events only";
    }
    else {
      return "Regional train line, special events only";
    }
  }

  // The line service will be in the description.
  if (service == "suburban") {
    const serviceName = "Suburban train line";

    // If this color group also has a special name (note that ones like "pink"
    // won't) then append it.
    const colorName = getColorName(color);
    if (colorName != null) {
      return `${serviceName}, ${colorName}`;
    }

    return serviceName;
  }

  // At this point service must be regional (since this function restricts
  // the service param to be either "suburban" or "regional" manually).
  return "Regional train line";
}

/**
 * Return the human-friendly name for the color, e.g. "Dandenong group" for
 * `cyan`.
 * @param color The line's color.
 */
function getColorName(color: "red" | "yellow" | "green" | "cyan" | "blue" |
  "purple" | "pink" | "grey"): string | null {

  if (color == "red") {
    return "Clifton Hill group";
  }
  if (color == "yellow") {
    return "Northern group";
  }
  if (color == "green") {
    return "cross-city group";
  }
  if (color == "cyan") {
    return "Dandenong group";
  }
  if (color == "blue") {
    return "Burnley group";
  }

  return null;
}

/**
 * Returns either the singular or plural version of the phrase based on the
 * given amount.
 * @param amount The amount of the thing.
 * @param singular The phrase for one of that object.
 * @param plural The phrase for multiple of that object.
 */
function pluralize(amount: number, singular: string, plural: string) {
  return amount == 1 ? singular : plural;
}
