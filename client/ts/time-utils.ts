import { DateTime } from "luxon";

const melbTimeZone = "Australia/Melbourne";

export function timeMelbString(timeUTC: DateTime, nowUTC: DateTime): string {
  const timeMelb = timeUTC.setZone(melbTimeZone);
  const timeString = timeMelb.toFormat("h:mma", { locale: "en-AU" });

  const nowMelb = nowUTC.setZone(melbTimeZone);
  const daysApart = timeMelb.startOf("day").diff(nowMelb.startOf("day")).as("days");
  if (daysApart == 0) {
    return timeString;
  }
  if (daysApart == 1 && timeMelb.hour <= 2) {
    return `${timeString} tonight`;
  }
  if (daysApart == 1) {
    return `${timeString} tomorrow`;
  }
  if (daysApart > 1 && daysApart < 7) {
    const weekday = timeMelb.toFormat("cccc", { locale: "en-AU" });
    return `${timeString} ${weekday}`;
  }
  if (daysApart == -1) {
    return `${timeString} yesterday`;
  }
  if (daysApart > -7 && daysApart < -1) {
    const weekday = timeMelb.toFormat("cccc", { locale: "en-AU" });
    return `${timeString} last ${weekday}`;
  }

  const date = timeMelb.toLocaleString(DateTime.DATE_MED);
  return `${timeString} (${date})`;
}

export function odometerString(time: DateTime, now: DateTime): string {
  const totalMins = Math.floor(time.diff(now).as("minutes"));
  if (totalMins < 0) { return "Departed"; }
  if (totalMins == 0) { return "Now"; }

  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins - hrs * 60;
  if (hrs == 0) { return `${mins.toFixed()} ${mins == 1 ? "min" : "mins"}`; }
  if (mins == 0) { return `${hrs.toFixed()} ${hrs == 1 ? "hr" : "hrs"}`; }

  return `${hrs.toFixed()} ${hrs == 1 ? "hr" : "hrs"}, ` +
    `${mins.toFixed()} ${mins == 1 ? "min" : "mins"}`;
}
