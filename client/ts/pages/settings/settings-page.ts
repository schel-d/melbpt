import { getInputOrThrow } from "../../utils/dom-utils";

export class SettingsPage {
  themePickerAuto: HTMLInputElement;
  themePickerLight: HTMLInputElement;
  themePickerDark: HTMLInputElement;

  constructor() {
    this.themePickerAuto = getInputOrThrow("theme-picker-auto");
    this.themePickerLight = getInputOrThrow("theme-picker-light");
    this.themePickerDark = getInputOrThrow("theme-picker-dark");
  }

  async init() {
    // Retrieve current theme from local storage, and check the appropriate
    // picker.
    const theme = window.localStorage.getItem("melbpt-theme");
    this.themePickerAuto.checked = true;
    this.themePickerLight.checked = theme == "light";
    this.themePickerDark.checked = theme == "dark";

    // If any picker is clicked, set the value in local storage and apply the
    // changes to the html element immediately.
    this.themePickerAuto.addEventListener("click", () => {
      window.localStorage.removeItem("melbpt-theme");
      window.document.documentElement.classList.remove("light", "dark");
    });
    this.themePickerLight.addEventListener("click", () => {
      window.localStorage.setItem("melbpt-theme", "light");
      window.document.documentElement.classList.remove("dark");
      window.document.documentElement.classList.add("light");
    });
    this.themePickerDark.addEventListener("click", () => {
      window.localStorage.setItem("melbpt-theme", "dark");
      window.document.documentElement.classList.remove("light");
      window.document.documentElement.classList.add("dark");
    });
  }
}
