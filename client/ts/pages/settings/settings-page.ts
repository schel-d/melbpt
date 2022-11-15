import { SettingsPageHtml } from "../../bundles/settings";
import { Page } from "../page";

export class SettingsPage extends Page<SettingsPageHtml> {
  constructor(html: SettingsPageHtml, apiOrigin: string) {
    super(html, apiOrigin);
  }

  async init() {
    // Retrieve current theme from local storage, and check the appropriate
    // picker.
    const theme = window.localStorage.getItem("melbpt-theme");
    this.html.themePickerAuto.checked = true;
    this.html.themePickerLight.checked = theme == "light";
    this.html.themePickerDark.checked = theme == "dark";

    // If any picker is clicked, set the value in local storage and apply the
    // changes to the html element immediately.
    this.html.themePickerAuto.addEventListener("click", () => {
      window.localStorage.removeItem("melbpt-theme");
      window.document.documentElement.classList.remove("light", "dark");
    });
    this.html.themePickerLight.addEventListener("click", () => {
      window.localStorage.setItem("melbpt-theme", "light");
      window.document.documentElement.classList.remove("dark");
      window.document.documentElement.classList.add("light");
    });
    this.html.themePickerDark.addEventListener("click", () => {
      window.localStorage.setItem("melbpt-theme", "dark");
      window.document.documentElement.classList.remove("light");
      window.document.documentElement.classList.add("dark");
    });
  }
}
