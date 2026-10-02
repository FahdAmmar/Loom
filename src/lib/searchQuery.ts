export type SearchScope = "title" | "content" | "tag";

export type UpdatedFilter = { kind: "today" } | { kind: "days"; days: number };

export interface ParsedSearch {
  /** What's left to search for once the filter words are taken out. */
  text: string;
  /** Empty means "anywhere"; otherwise only these kinds of match are kept. */
  scopes: SearchScope[];
  updated: UpdatedFilter | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SCOPE_WORDS: Record<string, SearchScope> = {
  title: "title",
  content: "content",
  tag: "tag",
  tags: "tag",
};
const FILTER_TOKEN = /^(in|updated):(.+)$/i;

function parseUpdated(value: string): UpdatedFilter | null {
  const word = value.toLowerCase();
  if (word === "today") return { kind: "today" };
  if (word === "week") return { kind: "days", days: 7 };
  if (word === "month") return { kind: "days", days: 30 };
  const days = /^(\d{1,3})d$/.exec(word);
  if (days && Number(days[1]) > 0) return { kind: "days", days: Number(days[1]) };
  return null;
}

/**
 * Pulls `in:title|content|tag` and `updated:today|week|month|<N>d` out of a query.
 * Anything not recognised stays in the text, so a literal search for "in:foo" still works.
 */
export function parseSearchQuery(raw: string): ParsedSearch {
  const scopes: SearchScope[] = [];
  let updated: UpdatedFilter | null = null;
  const words: string[] = [];

  for (const token of raw.split(/\s+/).filter(Boolean)) {
    const match = FILTER_TOKEN.exec(token);
    if (match) {
      const [, key, value] = match;
      if (key.toLowerCase() === "in") {
        const scope = SCOPE_WORDS[value.toLowerCase()];
        if (scope) {
          if (!scopes.includes(scope)) scopes.push(scope);
          continue;
        }
      } else {
        const parsed = parseUpdated(value);
        if (parsed) {
          updated = parsed;
          continue;
        }
      }
    }
    words.push(token);
  }
  return { text: words.join(" "), scopes, updated };
}

export function hasFilters(parsed: ParsedSearch): boolean {
  return parsed.scopes.length > 0 || parsed.updated !== null;
}

/** Earliest `updatedAt` (ms since epoch) that still passes the filter. */
export function updatedSince(filter: UpdatedFilter, now: Date): number {
  if (filter.kind === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  return now.getTime() - filter.days * MS_PER_DAY;
}
