import { DateTime } from "luxon";
import { z } from "zod";
import { Line, Stop, getNetwork } from "./network";

/**
 * Returns the data for a stop (if found in the given network object),
 * otherwise throws an error.
 * @param stopID The stop ID.
 */
export function getStop(stopID: number): Stop {
  const stop = tryGetStop(stopID);
  if (stop != null) { return stop; }
  throw new Error(`No stop with ID ${stop} was found.`);
}

/**
 * Returns the data for the stop (if found in the given network object).
 * @param stopID The stop ID.
 */
export function tryGetStop(stopID: number): Stop | null {
  return getNetwork().stops.find(s => s.id == stopID) ?? null;
}

/**
 * Returns the name of the stop (if found in the given network object),
 * otherwise throws an error.
 * @param stopID The stop ID.
 */
export function getStopName(stopID: number): string {
  return getStop(stopID).name;
}

/**
 * Returns the name of the stop (if found in the given network object).
 * @param stopID The stop ID.
 */
export function tryGetStopName(stopID: number): string | null {
  return tryGetStop(stopID)?.name ?? null;
}

/**
 * Returns the data for a line (if found in the given network object),
 * otherwise throws an error.
 * @param lineID The line ID.
 */
export function getLine(lineID: number): Line {
  const line = tryGetLine(lineID);
  if (line != null) { return line; }
  throw new Error(`No line with ID ${line} was found.`);
}

/**
 * Returns the data for the line (if found in the given network object).
 * @param lineID The line ID.
 */
export function tryGetLine(lineID: number): Line | null {
  return getNetwork().lines.find(l => l.id == lineID) ?? null;
}

/**
 * Zod parser for ISO8601 datetimes.
 */
export const parseDateTime = z.string().transform(s => DateTime.fromISO(s))
  .refine(d => d.isValid);
