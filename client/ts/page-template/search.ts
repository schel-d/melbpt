import { Network } from "../network";

export type SearchOption = {
  title: string,
  subtitle: string | null,
  icon: string,
  url: string,

  // Todo: Search tags, e.g. typing "Traralgon" should still bring up
  // "Gippsland line" imo.
}

export function searchOptionsStopsAndLines(network: Network): SearchOption[] {
  const options: SearchOption[] = [];

  options.push(...network.stops.map(s => {
    return {
      title: `${s.name} Station`,
      subtitle: "sumit",

      // Alternatives: "uil:map-marker", "uil:map-pin"
      icon: "ph:train-simple-bold",

      url: `/${s.urlName}`
    };
  }));

  options.push(...network.lines.map(l => {
    return {
      title: `${l.name} Line`,
      subtitle: "sumit",

      // Alternative: "uil:code-branch"
      icon: "uil:slider-h-range",

      url: `/lines/${l.id.toFixed()}`
    };
  }));

  return options;
}

export function searchOptionsWholeSite(network: Network): SearchOption[] {
  const options = searchOptionsStopsAndLines(network);

  options.push({
    title: "Lines",
    subtitle: null,
    icon: "uil:code-branch",
    url: "/lines"
  });
  options.push({
    title: "About",
    subtitle: null,
    icon: "uil:info-circle",
    url: "/about"
  });
  options.push({
    title: "Settings",
    subtitle: null,
    icon: "uil:setting",
    url: "/settings"
  });

  return options;
}

export function search(query: string, inputs: SearchOption[]): SearchOption[] {
  const results = inputs.filter(i =>
    i.title.toLowerCase().startsWith(query.toLowerCase()));

  return results.slice(0, 5);
}
