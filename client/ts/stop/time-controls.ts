import { getElementOrThrow, getInputOrThrow } from "../dom-utils";

export function initTimeControls() {
  const uiNow = getElementOrThrow("time-controls-ui-now");
  const uiDatetime = getElementOrThrow("time-controls-ui-datetime");

  getInputOrThrow("time-controls-mode-now").addEventListener("click", () => {
    uiNow.classList.remove("gone");
    uiDatetime.classList.add("gone");
  });
  getInputOrThrow("time-controls-mode-after").addEventListener("click", () => {
    uiNow.classList.add("gone");
    uiDatetime.classList.remove("gone");
  });
  getInputOrThrow("time-controls-mode-before").addEventListener("click", () => {
    uiNow.classList.add("gone");
    uiDatetime.classList.remove("gone");
  });
}

export function onTimeControlsOpened() {

}
