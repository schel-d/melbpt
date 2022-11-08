import { getNetwork } from "../utils/network";
import { lineDescription, stopDescription } from "./description";
import { similarity } from "./similarity";

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
  data: unknown | null,
  boost: number
}

/**
 * Returns a list of search options from every stop in the network. These
 * results have a `stop` value in the `data` value containing each stop's ID.
 */
export function searchOptionsStops(): SearchOption[] {
  const options: SearchOption[] = [];

  options.push(...getNetwork().stops.map(s => {
    return {
      title: `${s.name} station`,
      subtitle: stopDescription(s.id),
      icon: "uil:map-marker",
      url: `/${s.urlName}`,
      tags: s.tags,
      data: { stop: s.id },
      boost: 2
    };
  }));

  return options;
}

/**
 * Returns a list of search options from every line in the network. These
 * results have a `line` value in the `data` value containing each line's ID.
 */
export function searchOptionsLines(): SearchOption[] {
  const options: SearchOption[] = [];

  options.push(...getNetwork().lines.map(l => {
    return {
      title: `${l.name} line`,
      subtitle: lineDescription(l.service, l.color, l.specialEventsOnly),
      icon: "uil:slider-h-range",
      url: `/lines/${l.id.toFixed()}`,
      tags: l.tags,
      data: { line: l.id },
      boost: 1
    };
  }));
  return options;
}

/**
 * Returns a list of search options from every page on the site (every stop,
 * every line, the about page, the lines page, etc.).
 */
export function searchOptionsWholeSite(): SearchOption[] {
  const options = [
    ...searchOptionsStops(),
    ...searchOptionsLines()
  ];

  options.push({
    title: "Lines",
    subtitle: null,
    icon: "uil:code-branch",
    url: "/lines",
    tags: ["groups", "network", "stops", "stopping patterns", "metro", "vline",
      "suburban", "regional"],
    data: null,
    boost: 1
  });

  options.push({
    title: "About",
    subtitle: null,
    icon: "uil:info-circle",
    url: "/about",
    tags: ["contact", "legal", "timetables"],
    data: null,
    boost: 1
  });

  options.push({
    title: "Settings",
    subtitle: null,
    icon: "uil:setting",
    url: "/settings",
    tags: ["options", "preferences", "setup", "theme"],
    data: null,
    boost: 1
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
  if (query.length == 0 || query.length > 50) { return []; }

  query = textify(query);
  const queryBits = query.split(" ");

  // Calculate a score for each option (to be ranked by)...
  const results = options.map(o => {
    const title = textify(o.title);
    const titleBits = title.split(" ");

    // Baseline score - Overall similarity between the query and title. Allows
    // for misspelled words
    let score = similarity(query, title) * 2;

    // Add points for each word in the title matching being present in the query
    // too. Allows out of order words to still gain points (scaled to punish
    // longer titles).
    const titleBitsInQuery = titleBits.filter(q => queryBits.includes(q)).length;
    score += titleBitsInQuery / titleBits.length * 2;

    // Add points for each word in the title being similar to a word in the
    // query. Allows for out of order and misspelled words to still gain points
    // (scaled to punish longer titles).
    titleBits.forEach(t => queryBits.forEach(q =>
      score += similarity(q, t) / titleBits.length));

    // Same as above, but for the tags (which gain less points).
    const tagsInQuery = o.tags.filter(q => queryBits.includes(q)).length;
    score += tagsInQuery / titleBits.length;
    o.tags.forEach(t => queryBits.forEach(q =>
      score += similarity(q, t) * 0.5));

    // Some options are more likely to be searched for than others (e.g.
    // stations are more common than lines), so boost their scores.
    score *= o.boost;

    return {
      option: o,
      score: score
    };
  });

  // Sort by score (descending).
  const sorted = results.sort((a, b) => -(a.score - b.score));

  // Options scoring half the score of the first choice, or hardly scoring
  // better than the 20th are eliminated.
  const threshold = Math.max(sorted[0].score * 0.5, sorted[20].score * 1.2);
  const mostRelevant = sorted.slice(0, 10).filter(r => r.score >= threshold);

  // Return the list of options (strip the scores).
  return mostRelevant.map(r => r.option);
}

/**
 * Returns the same string, but normalized for search (trimmed and put in
 * lowercase)/
 * @param str The string to normalize.
 */
function textify(str: string): string {
  return str.toLowerCase().trim();
}
