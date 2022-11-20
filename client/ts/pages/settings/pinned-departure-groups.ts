import { DepartureGroup } from "../../departures/departure-group";

let cached: DepartureGroup[] | null = null;

export function getPinnedDepartureGroups(): DepartureGroup[] {
  if (cached != null) {
    return cached;
  }

  const json = window.localStorage.getItem("melbpt-pinned");
  if (json == undefined) {
    return [];
  }

  try {
    cached = DepartureGroup.json.array().parse(JSON.parse(json));
    return cached;
  }
  catch {
    return [];
  }
}

export function isPinned(potential: DepartureGroup): boolean {
  return getPinnedDepartureGroups().some(g => g.equals(potential));
}

export function savePinnedDepartureGroups(groups: DepartureGroup[]) {
  cached = groups;
  window.localStorage.setItem("melbpt-pinned", JSON.stringify(groups));
}
