import { DateTime } from "luxon";
import { finder } from "../../utils/finder";
import { melb, timeMelbString } from "../../utils/time-utils";
import { TimeControlsCalendar } from "./time-controls-calendar";

/**
 * The three possible modes that the time controls can be in.
 */
export type TimeControlsMode = "asap" | "after" | "before";

/**
 * Controls the content of the time controls dropdown.
 */
export class TimeControls {
  /**
   * The current mode set on the page. Not necessarily what is being shown in
   * as selected the dropdown.
   */
  mode: TimeControlsMode;

  /**
   * The current time the page is showing departures for. Not necessarily what
   * is being shown as selected in the dropdown.
   */
  timeUTC: DateTime | null;

  onSet: () => void;

  /**
   * Controls the calendar view within the time controls dropdown.
   */
  calendar: TimeControlsCalendar;

  uiNow: HTMLElement;
  uiDatetime: HTMLElement;
  pickerNow: HTMLInputElement;
  pickerAfter: HTMLInputElement;
  pickerBefore: HTMLInputElement;
  hourSelect: HTMLSelectElement;
  minuteSelect: HTMLSelectElement;
  timePickerAm: HTMLInputElement;
  timePickerPm: HTMLInputElement;
  submitButton: HTMLElement;

  constructor(whenParamString: string | null, onModeChange: () => void) {
    // By default, the time controls will be in "asap" mode.
    this.mode = "asap";
    this.timeUTC = null;

    // Get references to the permanent UI elements.
    this.uiNow = finder.any("time-controls-ui-now");
    this.uiDatetime = finder.any("time-controls-ui-datetime");
    this.pickerNow = finder.input("time-controls-mode-now");
    this.pickerAfter = finder.input("time-controls-mode-after");
    this.pickerBefore = finder.input("time-controls-mode-before");
    this.hourSelect = finder.select("time-controls-hour-select");
    this.minuteSelect = finder.select("time-controls-minute-select");
    this.timePickerAm = finder.input("time-controls-am");
    this.timePickerPm = finder.input("time-controls-pm");
    this.submitButton = finder.any("time-controls-submit-button");

    // If there was no param string provided, use the default as set above.
    if (whenParamString != null) {
      this.decodeParamString(whenParamString);
    }

    // Change view when mode pickers are clicked. Does NOT change mode variable
    // until "set" button is clicked.
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

    // Populate every hour and minute option in their respective selects.
    for (let i = 1; i <= 12; i++) {
      this.hourSelect.options.add(new Option(i.toFixed(), i.toFixed()));
    }
    for (let i = 0; i < 60; i++) {
      const minuteText = i.toFixed().padStart(2, "0");
      this.minuteSelect.options.add(new Option(minuteText, i.toFixed()));
    }

    // Add click listener for submit button.
    this.submitButton.addEventListener("click", () => this.onSubmitClicked());

    // Initialize calendar view.
    this.calendar = new TimeControlsCalendar(
      finder.any("time-controls-calendar")
    );

    // Save the listener to the stop page for later use.
    this.onSet = onModeChange;
  }

  /**
   * Called every time the time controls are opened.
   */
  onOpened() {
    // Reset the picker to the current mode (maybe we didn't choose set last
    // time).
    this.pickerNow.checked = this.mode == "asap";
    this.pickerAfter.checked = this.mode == "after";
    this.pickerBefore.checked = this.mode == "before";

    if (this.mode == "asap") {
      // Hide the calendar view for "asap" mode.
      this.uiNow.classList.remove("gone");
      this.uiDatetime.classList.add("gone");
      this.setCalendarAndTime(DateTime.utc());
    }
    else {
      // Show the calendar view for "asap" mode.
      this.uiNow.classList.add("gone");
      this.uiDatetime.classList.remove("gone");
      if (this.timeUTC == null) { throw new Error("Time shouldn't be null"); }
      this.setCalendarAndTime(this.timeUTC);
    }
  }

  /**
   * Sets the selected day in the calendar, and the selected hour and minute
   * options in their respective selects.
   * @param timeUTC The time to set each control to.
   */
  setCalendarAndTime(timeUTC: DateTime) {
    this.calendar.setSelected(timeUTC);

    const timeMelb = melb(timeUTC);
    const hour = (timeMelb.hour + 12 - 1) % 12 + 1;
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
      return `after-${this.timeUTC.toISO({
        format: "basic", suppressMilliseconds: true
      })}`;
    }
    if (this.mode == "before" && this.timeUTC != null) {
      return `before-${this.timeUTC.toISO({
        format: "basic", suppressMilliseconds: true
      })}`;
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

  /**
   * Called when the submit button is clicked. Pulls the selections from the UI
   * and passes them to the stop page via the listener.
   */
  onSubmitClicked() {
    // If picker for "asap" mode is selected...
    if (this.pickerNow.checked) {
      this.mode = 'asap';
      this.timeUTC = null;
      this.onSet();
      return;
    }

    // Otherwise work out time in UTC and set mode variable.
    const date = this.calendar.selectedDay;
    const hour = parseInt(this.hourSelect.value);
    const minute = parseInt(this.minuteSelect.value);
    const isPm = this.timePickerPm.checked;
    const hour24 = isPm ? 12 + hour % 12 : hour % 12;

    const timeMelb = date.plus({ hours: hour24 }).plus({ minutes: minute });
    this.timeUTC = timeMelb.toUTC();
    this.mode = this.pickerBefore.checked ? "before" : "after";
    this.onSet();
    return;
  }
}
