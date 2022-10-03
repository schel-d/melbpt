import { DepartureGroup } from "../stop/departure-group";

let cached: DepartureGroup[] | null = null;

export function getPinnedDepartureGroups(): DepartureGroup[] {
  if (cached != null) {
    return cached;
  }

  const json = window.localStorage.getItem("melbpt-pinned");
  if (json == undefined) {
    return [];
  }

  const pinned = DepartureGroup.json.array().parse(JSON.parse(json));
  cached = pinned.map(x => DepartureGroup.fromJson(x));
  return cached;
}

export function isPinned(potential: DepartureGroup): boolean {
  return getPinnedDepartureGroups().some(g => g.sameStopAndFilter(potential));
}

export function savePinnedDepartureGroups(groups: DepartureGroup[]) {
  cached = groups;
  window.localStorage.setItem("melbpt-pinned", JSON.stringify(groups));
}
