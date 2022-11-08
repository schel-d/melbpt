import { DateTime } from "luxon";
import { z } from "zod";

const melbTimeZone = "Australia/Melbourne";

/**
 * Zod parser for ISO8601 datetimes.
 */
export const dateTimeZodSchema = z.string().transform(s => DateTime.fromISO(s))
  .refine(d => d.isValid);

export function melb(timeUTC: DateTime): DateTime {
  return timeUTC.setZone(melbTimeZone);
}

export function timeMelbString(timeUTC: DateTime, nowUTC: DateTime): string {
  const timeMelb = timeUTC.setZone(melbTimeZone);
  const timeString = timeMelb.toFormat("h:mma", { locale: "en-AU" });

  const nowMelb = nowUTC.setZone(melbTimeZone);
  const durationApary = timeMelb.startOf("day").diff(nowMelb.startOf("day"));

  // Using Math.round here to account for the times where daylight savings means
  // for some reason this doesn't return a whole number (despite both being set
  // to the start of the day in Melbourne's timezone).
  const daysApart = Math.round(durationApary.as("days"));

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

export function minsDelta(time: DateTime, now: DateTime): number {
  return Math.floor(time.diff(now).as("minutes"));
}

export function odometerString(minsDelta: number): string {
  if (minsDelta < 0) { return "Departed"; }
  if (minsDelta == 0) { return "Now"; }

  const hrs = Math.floor(minsDelta / 60);
  const mins = minsDelta - hrs * 60;
  if (hrs == 0) { return `${mins.toFixed()} ${mins == 1 ? "min" : "mins"}`; }
  if (mins == 0) { return `${hrs.toFixed()} ${hrs == 1 ? "hr" : "hrs"}`; }

  return `${hrs.toFixed()} ${hrs == 1 ? "hr" : "hrs"}, ` +
    `${mins.toFixed()} ${mins == 1 ? "min" : "mins"}`;
}
