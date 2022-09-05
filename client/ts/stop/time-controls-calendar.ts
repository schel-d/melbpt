import { DateTime } from "luxon";
import { domButton, domDiv, domH3, domP, domPicker } from "../dom-utils";
import { melb } from "../time-utils";

export class TimeControlsCalendar {
  calendarDiv: HTMLElement;
  selectedDay: DateTime;

  dayButtons: { day: DateTime, radio: HTMLInputElement }[] = [];

  constructor(calendarDiv: HTMLElement) {
    this.calendarDiv = calendarDiv;

    const today = melb(DateTime.now()).startOf("day");
    this.selectedDay = today;
    const thisWeek = today.startOf("week");
    const firstDay = thisWeek.minus({ weeks: 1 });
    const lastDay = thisWeek.plus({ weeks: 3 });

    const weekdaysDiv = domDiv("weekdays");
    weekdaysDiv.append(...["M", "T", "W", "T", "F", "S", "S"].map(w => domP(w)));
    calendarDiv.append(weekdaysDiv);

    let lastMonth = -1;
    let currMonthDaysDiv: HTMLDivElement | null = null;
    for (let day = firstDay; day < lastDay; day = day.plus({ days: 1 })) {
      if (currMonthDaysDiv == null || day.month != lastMonth) {
        if (currMonthDaysDiv != null) {
          for (let i = day.weekday; i <= 7; i++) {
            const dayDiv = domDiv("day empty");
            currMonthDaysDiv.append(dayDiv);
          }
        }

        lastMonth = day.month;
        const monthH3 = domH3(day.toFormat("LLLL yyyy"));
        currMonthDaysDiv = domDiv("days");

        if (currMonthDaysDiv != null) {
          for (let i = 1; i < day.weekday; i++) {
            const dayDiv = domDiv("day empty");
            currMonthDaysDiv.append(dayDiv);
          }
        }

        const monthDiv = domDiv("month");
        monthDiv.append(monthH3, currMonthDaysDiv);
        calendarDiv.append(monthDiv);
      }

      const dayDiv = domPicker(
        "day", "day-button", "time-controls-day", day.day.toFixed()
      );

      dayDiv.label.addEventListener("click", () => {
        this.selectedDay = day;
      });

      if (day.hasSame(today, "day")) {
        dayDiv.label.classList.add("today");
      }
      if (day.hasSame(this.selectedDay, "day")) {
        dayDiv.radio.checked = true;
      }

      this.dayButtons.push({ day: day, radio: dayDiv.radio });
      currMonthDaysDiv.append(dayDiv.label);
    }
  }

  setSelected(dateUTC: DateTime) {
    this.selectedDay = melb(dateUTC).startOf("day");

    const dayButton = this.dayButtons.find(b => b.day.hasSame(dateUTC, "day"));
    if (dayButton != null) {
      dayButton.radio.checked = true;
    }
  }
}
