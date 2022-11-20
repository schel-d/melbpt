import { SettingsPageHtml } from "./bundle";
import { Page } from "../page";
import { getTheme, setTheme } from "../../settings/theme";

export class SettingsPage extends Page<SettingsPageHtml> {
  constructor(html: SettingsPageHtml) {
    super(html);
  }

  async init() {
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
}
