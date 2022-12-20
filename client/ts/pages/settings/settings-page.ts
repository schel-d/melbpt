import { SettingsPageHtml } from "./bundle";
import { Page } from "../page";
import { getTheme, setTheme } from "../../settings/theme";
import { getSettings, updateSettings } from "../../settings/settings";
import { getNetwork } from "../../utils/network";
import { domButton, domDiv, domIcon, domP, domSpan } from "../../utils/dom-utils";
import { getGroupName } from "../../departures/departure-filter-names";
import { moveDown, moveUp, unpin } from "../../settings/pinned-widgets";

export class SettingsPage extends Page<SettingsPageHtml> {
  constructor(html: SettingsPageHtml) {
    super(html);
  }

  async init() {
    this.initThemePicker();
    this.initPinnedWidgets();
    this.initMisc();
    this.html.settingsContainer.classList.remove("loading");
  }

  initThemePicker() {
    // Retrieve current theme from local storage, and check the appropriate
    // picker.
    const theme = getTheme();
    this.html.themePickerAuto.checked = true;
    this.html.themePickerLight.checked = theme == "light";
    this.html.themePickerDark.checked = theme == "dark";

    // If any picker is clicked, set the value in local storage and apply the
    // changes to the html element immediately.
    this.html.themePickerAuto.addEventListener("click", () => {
      setTheme(null, document.documentElement);
    });
    this.html.themePickerLight.addEventListener("click", () => {
      setTheme("light", document.documentElement);
    });
    this.html.themePickerDark.addEventListener("click", () => {
      setTheme("dark", document.documentElement);
    });
  }

  initPinnedWidgets() {
    this.layoutPinnedWidgets();
  }

  initMisc() {
    this.html.guessContinuationsSwitch.checked =
      getSettings().guessContinuations;

    this.html.guessContinuationsSwitch.addEventListener("click", () => {
      updateSettings(getSettings().with({
        guessContinuations: this.html.guessContinuationsSwitch.checked
      }));
    });
  }

  layoutPinnedWidgets() {
    const widgets = getSettings().pinnedWidgets;

    if (widgets.length == 0) {
      const $message = domP(
        "You don't have any pinned widgets at the moment.", "empty-message"
      );
      this.html.pinnedWidgets.replaceChildren($message);
      return;
    }

    this.html.pinnedWidgets.replaceChildren(...widgets.map((w, index) => {
      const stopName = getNetwork().requireStop(w.stop).name;

      const $stopName = domSpan(stopName, "stop-name");
      const $separatorDot = domSpan("•", "separator-dot");
      const $filterName = domSpan(getGroupName(w), "filter-name");
      const $p = domP("");
      $p.append($stopName, $separatorDot, $filterName);
      const $pWrapper = domDiv("one-line");
      $pWrapper.append($p);

      const $gap = domDiv("flex-grow");

      const $upButton = domButton("");
      $upButton.title = "Move up";
      $upButton.disabled = index == 0;
      $upButton.append(domIcon("uil:angle-up"));
      $upButton.addEventListener("click", () => {
        moveUp(w);
        this.layoutPinnedWidgets();
      });

      const $downButton = domButton("");
      $downButton.title = "Move down";
      $downButton.disabled = index == widgets.length - 1;
      $downButton.append(domIcon("uil:angle-down"));
      $downButton.addEventListener("click", () => {
        moveDown(w);
        this.layoutPinnedWidgets();
      });

      const $unpinButton = domButton("");
      $unpinButton.title = "Un-pin widget";
      $unpinButton.append(domIcon("uil:trash-alt"));
      $unpinButton.addEventListener("click", () => {
        unpin(w);
        this.layoutPinnedWidgets();
      });

      const $div = domDiv("pinned-widget");
      $div.append($pWrapper, $gap, $upButton, $downButton, $unpinButton);
      return $div;
    }));
  }
}
