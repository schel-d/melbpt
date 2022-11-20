import { DepartureGroup } from "../departures/departure-group";
import { getSettings, updateSettings } from "./settings";
import { maxPinnedWidgets } from "./settings-v1";

/**
 * Returns true if the given group is pinned in the settings.
 * @param group The group.
 */
export function isPinned(group: DepartureGroup) {
  return getSettings().pinnedWidgets.some(g => g.equals(group));
}

/**
 * Adds the group to the pinned widgets in the settings.
 * @param group The group.
 */
export function pin(group: DepartureGroup) {
  const newPinned = [...getSettings().pinnedWidgets, group];
  updateSettings(getSettings().with({ pinnedWidgets: newPinned }));
}

/**
 * Removes the group from the pinned widgets in the settings.
 * @param group The group.
 */
export function unpin(group: DepartureGroup) {
  const newPinned = getSettings().pinnedWidgets.filter(x => !x.equals(group));
  updateSettings(getSettings().with({ pinnedWidgets: newPinned }));
}

/**
 * Does either {@link pin}, {@link unpin}, or nothing, depending on
 * {@link pinned} and whether it is currently pinned.
 * @param group The group.
 */
export function setPinned(group: DepartureGroup, pinned: boolean) {
  if (pinned && !isPinned(group)) {
    pin(group);
  }
  if (!pinned && isPinned(group)) {
    unpin(group);
  }
}

/**
 * Moves the group one space closer to the front of the list. Does nothing if
 * the group is already the first pinned item.
 * @param group The group.
 */
export function moveUp(group: DepartureGroup) {
  const newPinned = [...getSettings().pinnedWidgets];
  const currIndex = newPinned.findIndex(g => g.equals(group));
  if (currIndex == -1) { throw new Error("That group is not pinned."); }

  // If already at the top, do nothing.
  if (currIndex == 0) { return; }

  // Remove the old group.
  newPinned.splice(currIndex, 1);

  // Re-insert the group at the new index.
  newPinned.splice(currIndex - 1, 0, group);

  updateSettings(getSettings().with({ pinnedWidgets: newPinned }));
}

/**
 * Moves the group one space closer to the end of the list. Does nothing if the
 * group is already the last pinned item.
 * @param group The group.
 */
export function moveDown(group: DepartureGroup) {
  const newPinned = [...getSettings().pinnedWidgets];
  const currIndex = newPinned.findIndex(g => g.equals(group));
  if (currIndex == -1) { throw new Error("That group is not pinned."); }

  // If already at the bottom, do nothing.
  if (currIndex == newPinned.length - 1) { return; }

  // Remove the old group.
  newPinned.splice(currIndex, 1);

  // Re-insert the group at the new index.
  newPinned.splice(currIndex + 1, 0, group);

  updateSettings(getSettings().with({ pinnedWidgets: newPinned }));
}

/** Returns false if the maximum limit of pinned widgets has been reached. */
export function canPinMore(): boolean {
  return getSettings().pinnedWidgets.length < maxPinnedWidgets;
}
