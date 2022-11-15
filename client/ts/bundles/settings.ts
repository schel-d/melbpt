import { setupPage } from "../pages/page";
import { SettingsPage } from "../pages/settings/settings-page";
import { finder } from "schel-d-utils-browser";

const html = {
  themePickerAuto: finder.input("theme-picker-auto"),
  themePickerLight: finder.input("theme-picker-light"),
  themePickerDark: finder.input("theme-picker-dark")
};
export type SettingsPageHtml = typeof html;

setupPage(() => new SettingsPage(html));
