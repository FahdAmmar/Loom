const FORBIDDEN_CHARS = /[\\/:*?"<>|\p{Cc}]/gu;
const MAX_LENGTH = 80;

/** Keeps Unicode letters (Arabic titles stay readable) and drops only what file systems reject. */
export function toSafeFileName(title: string, fallback = "Untitled"): string {
  const cleaned = title.replace(FORBIDDEN_CHARS, " ").replace(/\s+/g, " ").trim();
  const trimmed = cleaned.slice(0, MAX_LENGTH).replace(/[. ]+$/, "");
  return trimmed || fallback;
}

/** Returns `name`, or `name-2`, `name-3`, ... when `taken` already holds it (case-insensitive). */
export function uniqueName(name: string, taken: Set<string>): string {
  let candidate = name;
  let counter = 2;
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${name}-${counter}`;
    counter += 1;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}
