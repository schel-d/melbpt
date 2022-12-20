import { domA, domButton, domDiv, domH2, domIcon, domSpan }
  from "../utils/dom-utils";
import { departureHeightRem } from "./departure-div";
import { DepartureGroupControllerTitles } from "./departure-group-controller";

/**
 * Creates the HTML for a departure group. Returns a reference to the group div
 * and also the departures list div.
 * @param titles The titles to use.
 * @param count How many departures this group will show at once (determines
 * height).
 * @param enablepinButton Whether to show a pin button.
 */
export function createDepartureGroup(titles: DepartureGroupControllerTitles,
  count: number, enablepinButton: boolean) {

  // Create the header.
  const header = domH2("");
  let titleElement = domSpan(titles.title, "title");
  if (titles.titleLink != null) {
    titleElement = domA(titles.titleLink, "title");
    titleElement.textContent = titles.title;
  }
  header.append(titleElement);

  // Append a subtitle to the header if available.
  if (titles.subtitle != null) {
    const separatorElement = domSpan("•", "separator-dot");
    let subtitleElement = domSpan(titles.subtitle, "subtitle");
    if (titles.subtitleLink != null) {
      subtitleElement = domA(titles.subtitleLink, "subtitle");
      subtitleElement.textContent = titles.subtitle;
    }
    header.append(separatorElement, subtitleElement);
  }

  const headerRow = domDiv("departure-group-header");
  headerRow.append(header);

  let pinButton: HTMLButtonElement | null = null;
  if (enablepinButton) {
    const favIcon = domIcon("majesticons:pin-line");
    const favCheckedIcon = domIcon("majesticons:pin", "checked-icon");
    pinButton = domButton("departure-group-fav-button");
    pinButton.title = "Pin widget";
    pinButton.append(favIcon, favCheckedIcon);
    headerRow.append(pinButton);
  }

  // Create an empty div for the departures to fill later.
  const departuresListDiv = domDiv("departure-list");
  departuresListDiv.style.height = `${(departureHeightRem * count)}rem`;

  const groupDiv = domDiv("departure-group");
  groupDiv.append(headerRow, departuresListDiv);

  return {
    groupDiv: groupDiv,
    departuresListDiv: departuresListDiv,
    pinButton: pinButton
  };
}
