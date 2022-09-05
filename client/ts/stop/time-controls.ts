import { DateTime } from "luxon";
import { getElementOrThrow, getInputOrThrow, getSelectOrThrow } from "../dom-utils";
import { melb, timeMelbString } from "../time-utils";
import { TimeControlsCalendar } from "./time-controls-calendar";

export type TimeControlsMode = "asap" | "after" | "before";

export class TimeControls {
  mode: TimeControlsMode = "asap";
  timeUTC: DateTime | null = null;

  onModeChange: () => void;

  uiNow = getElementOrThrow("time-controls-ui-now");
  uiDatetime = getElementOrThrow("time-controls-ui-datetime");
  pickerNow = getInputOrThrow("time-controls-mode-now");
  pickerAfter = getInputOrThrow("time-controls-mode-after");
  pickerBefore = getInputOrThrow("time-controls-mode-before");

  calendar: TimeControlsCalendar;
  hourSelect = getSelectOrThrow("time-controls-hour-select");
  minuteSelect = getSelectOrThrow("time-controls-minute-select");
  timePickerAm = getInputOrThrow("time-controls-am");
  timePickerPm = getInputOrThrow("time-controls-pm");

  constructor(whenParamString: string | null, onModeChange: () => void) {
    // If there was no param string provided, use the default as set above.
    if (whenParamString != null) {
      this.decodeParamString(whenParamString);
    }

    this.initModePickers();

    this.calendar = new TimeControlsCalendar(
      getElementOrThrow("time-controls-calendar")
    );

    this.onModeChange = onModeChange;
  }

  /**
   * Sets up the events on the mode pickers.
   */
  initModePickers() {
    this.pickerNow.addEventListener("click", () => {
      this.uiNow.classList.remove("gone");
      this.uiDatetime.classList.add("gone");
    });
    this.pickerAfter.addEventListener("click", () => {
      this.uiNow.classList.add("gone");
      this.uiDatetime.classList.remove("gone");
    });
    this.pickerBefore.addEventListener("click", () => {
      this.uiNow.classList.add("gone");
      this.uiDatetime.classList.remove("gone");
    });

    for (let i = 1; i <= 12; i++) {
      this.hourSelect.options.add(
        new Option(i.toFixed(), i.toFixed())
      );
    }
    for (let i = 0; i < 60; i++) {
      this.minuteSelect.options.add(
        new Option(i.toFixed().padStart(2, "0"), i.toFixed())
      );
    }
  }

  /**
   * Called every time the time controls are opened.
   */
  onOpened() {
    this.pickerNow.checked = this.mode == "asap";
    this.pickerAfter.checked = this.mode == "after";
    this.pickerBefore.checked = this.mode == "before";

    if (this.mode == "asap") {
      this.uiNow.classList.remove("gone");
      this.uiDatetime.classList.add("gone");
      this.setCalendarAndTime(DateTime.utc());
    }
    else {
      this.uiNow.classList.add("gone");
      this.uiDatetime.classList.remove("gone");
      if (this.timeUTC == null) { throw new Error("Time shouldn't be null"); }
      this.setCalendarAndTime(this.timeUTC);
    }
  }

  setCalendarAndTime(timeUTC: DateTime) {
    this.calendar.setSelected(timeUTC);

    const timeMelb = melb(timeUTC);
    const hour = (timeMelb.hour - 1) % 12 + 1;
    this.hourSelect.value = hour.toFixed();
    this.minuteSelect.value = timeMelb.minute.toFixed();

    this.timePickerAm.checked = timeMelb.hour < 12;
    this.timePickerPm.checked = timeMelb.hour >= 12;
  }

  /**
   * Returns the string to be used in the url bar for the current state of the
   * time controls.
   */
  encodeParamString(): string | null {
    if (this.mode == "after" && this.timeUTC != null) {
      return `after-${this.timeUTC.toISO()}`;
    }
    if (this.mode == "before" && this.timeUTC != null) {
      return `before-${this.timeUTC.toISO()}`;
    }
    return null;
  }

  /**
   * Takes a string from the url params and sets {@link this.mode} and
   * {@link this.timeUTC} based on it's value.
   * @param whenParamString The string in the url parameters for "when".
   */
  decodeParamString(whenParamString: string) {
    // In the case of "after-2022-09-05T9:59:00Z".
    if (whenParamString.startsWith("after-")) {
      const timeUTC = DateTime.fromISO(whenParamString.substring("after-".length));
      if (timeUTC.isValid) {
        this.mode = "after";
        this.timeUTC = timeUTC;
        return;
      }
    }

    // In the case of "before-2022-09-05T9:59:00Z".
    if (whenParamString.startsWith("before-")) {
      const timeUTC = DateTime.fromISO(whenParamString.substring("before-".length));
      if (timeUTC.isValid) {
        this.mode = "before";
        this.timeUTC = timeUTC;
        return;
      }
    }

    // Anything else, including invalid values, will default to asap mode.
    this.mode = "asap";
    this.timeUTC = null;
    return;
  }

  /**
   * Returns the string that should be shown on the time controls button, based
   * on the current mode and time set in this object.
   */
  buttonText(): string {
    if (this.mode == "after" && this.timeUTC != null) {
      return `After ${timeMelbString(this.timeUTC, DateTime.utc())}`;
    }
    if (this.mode == "before" && this.timeUTC != null) {
      return `Before ${timeMelbString(this.timeUTC, DateTime.utc())}`;
    }
    return "Now";
  }
}
