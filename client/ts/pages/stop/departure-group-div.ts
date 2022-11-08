import { domA, domButton, domDiv, domH2, domIconify, domSpan }
  from "../../utils/dom-utils";
import { departureHeightRem } from "./departure-div";

/**
 * Creates the HTML for a departure group. Returns a reference to the group div
 * and also the departures list div.
 * @param title The title of the group.
 * @param subtitle The subtitle of the group.
 * @param count How many departures this group will show at once (determines
 * height).
 */
export function createDepartureGroup(title: string, subtitle: string | null,
  count: number, enablepinButton: boolean, titleHref: string | null) {

  // Create the header.
  const header = domH2("");
  let titleElement = domSpan(title, "title");
  if (titleHref != null) {
    titleElement = domA(titleHref, "title");
    titleElement.textContent = title;
  }
  header.append(titleElement);

  // Append a subtitle to the header if available.
  if (subtitle != null) {
    const separatorElement = domSpan("•", "separator-dot");
    header.append(separatorElement, subtitle);
  }

  const headerRow = domDiv("departure-group-header");
  headerRow.append(header);

  let pinButton: HTMLButtonElement | null = null;
  if (enablepinButton) {
    const favIcon = domIconify("majesticons:pin-line");
    const favCheckedIcon = domIconify("majesticons:pin", "checked-icon");
    pinButton = domButton("departure-group-fav-button");
    pinButton.title = "Pin widget";
    if (Math.random() > 0.5) {
      pinButton.classList.add("checked");
    }
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
