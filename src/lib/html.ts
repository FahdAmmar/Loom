import DOMPurify from "dompurify";

// Only what the editor itself can produce: marks, line breaks, and wikilink chips.
const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "s", "code", "mark", "span"];
const ALLOWED_ATTR = ["class", "data-page-link", "data-page-id", "data-color"];

/** Parses into an inert document, so nothing loads or runs (unlike `innerHTML` on a detached node). */
export function parseHtmlFragment(html: string): HTMLElement {
  return new DOMParser().parseFromString(html, "text/html").body;
}

/** Stored rich text can come from a restored backup, so sanitize before rendering it as HTML. */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}
