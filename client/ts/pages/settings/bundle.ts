import { setupPage } from "../page";
import { SettingsPage } from "./settings-page";
import { finder } from "schel-d-utils-browser";

const html = {
  settingsContainer: finder.div("settings-container"),
  themePickerAuto: finder.input("theme-picker-auto"),
  themePickerLight: finder.input("theme-picker-light"),
  themePickerDark: finder.input("theme-picker-dark"),
  pinnedWidgets: finder.div("pinned-widgets"),
  guessContinuationsSwitch: finder.input("guess-continuations-switch")
};
export type SettingsPageHtml = typeof html;

setupPage(() => new SettingsPage(html));
