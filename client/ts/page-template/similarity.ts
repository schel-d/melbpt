/**
 * Returns a score that hopefully is a decent metric for measuring how similar
 * two strings are for searching purposes.
 * @param query The search query.
 * @param tag The title/tag of the thing being searched for.
 */
export function similarity(query: string, tag: string): number {
  let mismatch = 0;
  for (let i = 0; i < query.length; i++) {
    if (query[i] == tag[i]) {
      continue;
    }
    if (query[i] == tag[i - 1] || query[i] == tag[i + 1]) {
      mismatch += 0.8 * Math.pow(0.95, i);
      continue;
    }
    if (query[i] == tag[i - 2] || query[i] == tag[i + 2]) {
      mismatch += 0.9 * Math.pow(0.95, i);
      continue;
    }
    mismatch += 1 * Math.pow(0.95, i);
  }
  return 1 * Math.pow(0.75, mismatch);
}
