import { getInputOrThrow } from "../dom-utils";

init();

async function init() {
  const themePickerAuto = getInputOrThrow("theme-picker-auto");
  const themePickerLight = getInputOrThrow("theme-picker-light");
  const themePickerDark = getInputOrThrow("theme-picker-dark");

  // Retrieve current theme from local storage, and check the appropriate
  // picker.
  const theme = window.localStorage.getItem("melbpt-theme");
  themePickerAuto.checked = true;
  themePickerLight.checked = theme == "light";
  themePickerDark.checked = theme == "dark";

  // If any picker is clicked, set the value in local storage and apply the
  // changes to the html element immediately.
  themePickerAuto.addEventListener("click", () => {
    window.localStorage.removeItem("melbpt-theme");
    window.document.documentElement.classList.remove("light", "dark");
  });
  themePickerLight.addEventListener("click", () => {
    window.localStorage.setItem("melbpt-theme", "light");
    window.document.documentElement.classList.remove("dark");
    window.document.documentElement.classList.add("light");
  });
  themePickerDark.addEventListener("click", () => {
    window.localStorage.setItem("melbpt-theme", "dark");
    window.document.documentElement.classList.remove("light");
    window.document.documentElement.classList.add("dark");
  });
}
