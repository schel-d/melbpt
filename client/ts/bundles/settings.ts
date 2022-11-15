import { setupPage } from "../pages/page";
import { SettingsPage } from "../pages/settings/settings-page";
import { finder } from "schel-d-utils-browser";

declare global {
  interface Window {
    apiOrigin: string
  }
}

const html = {
  themePickerAuto: finder.input("theme-picker-auto"),
  themePickerLight: finder.input("theme-picker-light"),
  themePickerDark: finder.input("theme-picker-dark")
};
export type SettingsPageHtml = typeof html;

setupPage(() => new SettingsPage(html, window.apiOrigin));
