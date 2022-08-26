import { domDiv, domH2, domSpan } from "../dom-utils";

export const departureHeightRem = 4.7;

/**
 * Creates the HTML for a departure group.
 * @param title The title of the group.
 * @param subtitle The subtitle of the group.
 * @param count How many departures this group will show at once (determines
 * height).
 */
export function createDepartureGroup(title: string, subtitle: string | null,
  count: number) {

  const groupDiv = domDiv("departure-group");

  // Create the header.
  const header = domH2("", "departure-group-header");
  const titleElement = domSpan(title, "title");
  header.append(titleElement);

  // Append a subtitle to the header if available.
  if (subtitle != null) {
    const separatorElement = domSpan("•", "separator-dot");
    header.append(separatorElement, subtitle);
  }

  // Create an empty div for the departures to fill later.
  const departuresListDiv = domDiv("departure-list");
  departuresListDiv.style.height = `${(departureHeightRem * count)}rem`;

  groupDiv.append(header, departuresListDiv);

  return {
    groupDiv: groupDiv,
    departuresListDiv: departuresListDiv
  };
}
