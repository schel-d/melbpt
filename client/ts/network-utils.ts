import { Network } from "./network";

/**
 * Returns the name of the stop (if found in the given network object),
 * otherwise throws an error.
 * @param network The stops and lines information.
 * @param stop The stop ID.
 */
export function getStopName(network: Network, stop: number): string {
  const name = tryGetStopName(network, stop);
  if (name != null) { return name; }
  throw new Error(`No stop with ID ${stop} was found.`);
}

/**
 * Returns the name of the stop (if found in the given network object).
 * @param network The stops and lines information.
 * @param stop The stop ID.
 */
export function tryGetStopName(network: Network, stop: number): string | null {
  return network.stops.find(s => s.id == stop)?.name ?? null;
}
