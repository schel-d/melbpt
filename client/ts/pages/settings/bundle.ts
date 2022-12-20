import { setupPage } from "../page";
import { SettingsPage } from "./settings-page";
import { find } from "schel-d-utils-browser";

const html = {
  settingsContainer: find.div("settings-container"),
  themePickerAuto: find.input("theme-picker-auto"),
  themePickerLight: find.input("theme-picker-light"),
  themePickerDark: find.input("theme-picker-dark"),
  pinnedWidgets: find.div("pinned-widgets"),
  guessContinuationsSwitch: find.input("guess-continuations-switch")
};
export type SettingsPageHtml = typeof html;

setupPage(() => new SettingsPage(html));
