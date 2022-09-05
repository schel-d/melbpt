import { DateTime } from "luxon";
import { domDiv, domH3, domP, domPicker } from "../dom-utils";
import { melb } from "../time-utils";

/**
 * Controlls the calendar UI in the time controls dropdown.
 */
export class TimeControlsCalendar {
  /**
   * The div to create the calendar UI inside.
   */
  calendarDiv: HTMLElement;

  /**
   * Which day is currently selected in the calendar UI.
   */
  selectedDay: DateTime;

  /**
   * Stores every day button in the calendar UI. Used by {@link setSelected} to
   * make the day show itself as selected.
   */
  private _dayButtons: { day: DateTime, radio: HTMLInputElement }[] = [];

  constructor(calendarDiv: HTMLElement) {
    this.calendarDiv = calendarDiv;

    // Work out the start and end dates of the calendar to build.
    // The week before this week, and the next two weeks will be shown.
    const today = melb(DateTime.now()).startOf("day");
    this.selectedDay = today;
    const thisWeek = today.startOf("week");
    const firstDay = thisWeek.minus({ weeks: 1 });
    const lastDay = thisWeek.plus({ weeks: 3 });

    // Create the weekday labels.
    const weekdaysDiv = domDiv("weekdays");
    weekdaysDiv.append(...["M", "T", "W", "T", "F", "S", "S"].map(w => domP(w)));
    calendarDiv.append(weekdaysDiv);

    // As we generate each day's button, keep record of which month we're
    // creating, and the div to put the days inside of.
    let lastMonth = -1;
    let currMonthDaysDiv: HTMLDivElement | null = null;

    // For each day in the calendar...
    for (let day = firstDay; day < lastDay; day = day.plus({ days: 1 })) {
      // If this is the start of a new month...
      if (currMonthDaysDiv == null || day.month != lastMonth) {
        // Complete the last month by filling the remaining slots in last week
        // with blanks.
        if (currMonthDaysDiv != null) {
          for (let i = day.weekday; i <= 7; i++) {
            const dayDiv = domDiv("day empty");
            currMonthDaysDiv.append(dayDiv);
          }
        }

        // Create the header for the month's div.
        lastMonth = day.month;
        const monthH3 = domH3(day.toFormat("LLLL yyyy"));
        currMonthDaysDiv = domDiv("days");

        // Offset the first day in the month to the right day of the week by
        // inserting blanksc.
        if (currMonthDaysDiv != null) {
          for (let i = 1; i < day.weekday; i++) {
            const dayDiv = domDiv("day empty");
            currMonthDaysDiv.append(dayDiv);
          }
        }

        // Create the month's div.
        const monthDiv = domDiv("month");
        monthDiv.append(monthH3, currMonthDaysDiv);
        calendarDiv.append(monthDiv);
      }

      // Create the picker (radio button disguised as button) for each day.
      const dayDiv = domPicker(
        "day", "day-button", "time-controls-day", day.day.toFixed()
      );

      // If clicked, change the selected day variable.
      dayDiv.label.addEventListener("click", () => {
        this.selectedDay = day;
      });

      // If today, add today styling.
      if (day.hasSame(today, "day")) {
        dayDiv.label.classList.add("today");
      }

      // If selected, check the radio button (since a picker is really a radio
      // button in disguise).
      if (day.hasSame(this.selectedDay, "day")) {
        dayDiv.radio.checked = true;
      }

      // Add the day button to the current month.
      this._dayButtons.push({ day: day, radio: dayDiv.radio });
      currMonthDaysDiv.append(dayDiv.label);
    }
  }

  /**
   * Change the selected day to the given variable. If the day falls outside the
   * range of this calendar, it won't be shown on the UI.
   * @param dateUTC The date to change the selection to.
   */
  setSelected(dateUTC: DateTime) {
    this.selectedDay = melb(dateUTC).startOf("day");

    const dayButton = this._dayButtons.find(b => b.day.hasSame(dateUTC, "day"));
    if (dayButton != null) {
      dayButton.radio.checked = true;
    }
  }
}
