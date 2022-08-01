import { Network } from "../network";
import { lineDescription, stopDescription } from "./description";

/**
 * Something that could be search, and therefore selected as a result of a
 * search.
 */
export type SearchOption = {
  title: string,
  subtitle: string | null,
  icon: string,
  url: string,
  tags: string[],
  data: unknown | null
}

/**
 * Returns a list of search options from every stop in the network. These
 * results have a `stop` value in the `data` value containing each stop's ID.
 * @param network Network object contain the stops information.
 */
export function searchOptionsStops(network: Network): SearchOption[] {
  const options: SearchOption[] = [];

  options.push(...network.stops.map(s => {
    return {
      title: `${s.name} station`,
      subtitle: stopDescription(s.id, network),
      icon: "uil:map-marker", // Alt: "ph:train-simple-bold", "uil:map-pin"
      url: `/${s.urlName}`,
      tags: s.tags,
      data: { stop: s.id }
    };
  }));

  return options;
}

/**
 * Returns a list of search options from every line in the network. These
 * results have a `line` value in the `data` value containing each line's ID.
 * @param network Network object contain the lines information.
 */
export function searchOptionsLines(network: Network): SearchOption[] {
  const options: SearchOption[] = [];

  options.push(...network.lines.map(l => {
    return {
      title: `${l.name} line`,
      subtitle: lineDescription(l.id, l.service, l.color),
      icon: "uil:slider-h-range", // Alt: "uil:code-branch"
      url: `/lines/${l.id.toFixed()}`,
      tags: l.tags,
      data: { line: l.id }
    };
  }));
  return options;
}

/**
 * Returns a list of search options from every page on the site (every stop,
 * every line, the about page, the lines page, etc.).
 * @param network The network object with stops and lines information.
 */
export function searchOptionsWholeSite(network: Network): SearchOption[] {
  const options = [
    ...searchOptionsStops(network),
    ...searchOptionsLines(network)
  ];

  options.push({
    title: "Lines",
    subtitle: null,
    icon: "uil:code-branch",
    url: "/lines",
    tags: ["groups", "network", "stops", "stopping patterns", "metro", "vline",
      "suburban", "regional"],
    data: null
  });

  options.push({
    title: "About",
    subtitle: null,
    icon: "uil:info-circle",
    url: "/about",
    tags: ["contact", "legal", "timetables"],
    data: null
  });

  options.push({
    title: "Settings",
    subtitle: null,
    icon: "uil:setting",
    url: "/settings",
    tags: ["options", "preferences", "setup", "theme"],
    data: null
  });

  return options;
}

/**
 * Returns a list of options from the given options that best match the query
 * string. Returns at most 10 results.
 * @param query The query string.
 * @param options The possible options that can be searched for.
 */
export function search(query: string, options: SearchOption[]): SearchOption[] {
  if (query.length == 0) { return []; }

  const results = options.filter(i =>
    [i.title, ...i.tags].some(t =>
      t.toLowerCase().startsWith(query.toLowerCase())
    )
  );

  return results.slice(0, 10);
}
