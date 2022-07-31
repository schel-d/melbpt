import { Network } from "../network";

export type SearchOption = {
  title: string,
  subtitle: string | null,
  icon: string,
  url: string,
  tags: string[]
}

export function searchOptionsStopsAndLines(network: Network): SearchOption[] {
  const options: SearchOption[] = [];

  const stopExceptions = [
    { stop: 104, description: "Suburban train hub + Gippsland line" },
    {
      stop: 253,
      description: "Regional train hub + all suburban lines except " +
        "Sandringham and Stony Point"
    },
    { stop: 101, description: "Underground city loop station" },
    { stop: 171, description: "Underground city loop station" },
    { stop: 216, description: "Underground city loop station" }
  ];

  const createDescription = (lineNames: string[]) => {
    if (lineNames.length == 0) { return "No train lines?"; }
    if (lineNames.length == 1) { return `${lineNames[0]} line`; }
    if (lineNames.length == 2) { return `${lineNames[0]} and ${lineNames[1]} lines`; }
    if (lineNames.length == 3) {
      return `${lineNames[0]}, ${lineNames[1]}, and ${lineNames[2]} lines`;
    }
    if (lineNames.length == 4) {
      return `${lineNames[0]}, ${lineNames[1]}, ${lineNames[2]}, and ` +
        `${lineNames[3]} lines`;
    }
    return `Multiple lines`;
  };

  options.push(...network.stops.map(s => {
    const lineNames = network.lines
      .filter(l => l.directions.some(d => d.stops.includes(s.id)))
      .map(l => l.name)
      .sort((a, b) => a.localeCompare(b));

    const exception = stopExceptions.find(e => e.stop == s.id);
    const description = exception != null ?
      exception.description : createDescription(lineNames);

    return {
      title: `${s.name} station`,
      subtitle: description,

      // icon: "ph:train-simple-bold",
      icon: "uil:map-marker",
      // icon: "uil:map-pin",

      url: `/${s.urlName}`,
      tags: s.tags
    };
  }));

  options.push(...network.lines.map(l => {
    return {
      title: `${l.name} line`,
      subtitle: l.description,

      icon: "uil:slider-h-range",
      // icon: "uil:code-branch",

      url: `/lines/${l.id.toFixed()}`,
      tags: l.tags
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
    url: "/lines",
    tags: ["groups", "network", "stopping patterns"]
  });
  options.push({
    title: "About",
    subtitle: null,
    icon: "uil:info-circle",
    url: "/about",
    tags: ["contact", "legal", "timetables"]
  });
  options.push({
    title: "Settings",
    subtitle: null,
    icon: "uil:setting",
    url: "/settings",
    tags: ["options", "preferences", "setup", "theme", "light theme", "dark theme"]
  });

  return options;
}

export function search(query: string, inputs: SearchOption[]): SearchOption[] {
  const results = inputs.filter(i =>
    [i.title, ...i.tags].some(t =>
      t.toLowerCase().startsWith(query.toLowerCase())
    )
  );

  return results.slice(0, 10);
}
