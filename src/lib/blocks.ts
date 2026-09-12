import type { Block, BlockType } from "@/types/entities";

/** Matches the HTML the pageLink Tiptap node renders/parses (see features/editor/nodes),
 * regardless of attribute order within the tag. */
const PAGE_LINK_ID_PATTERN =
  /<span\b(?=[^>]*\bdata-page-link\b)(?=[^>]*\bdata-page-id="([^"]+)")[^>]*>/g;

/** Every page id referenced by [[wikilink]] chips inside a block's stored HTML. */
export function extractPageLinkIdsFromHtml(html: string): string[] {
  const ids: string[] = [];
  for (const match of html.matchAll(PAGE_LINK_ID_PATTERN)) ids.push(match[1]);
  return ids;
}

/**
 * Rewrites the displayed text of every wikilink chip pointing at `pageId`
 * to `newTitle`, leaving every other attribute (and every chip pointing
 * elsewhere) untouched. A chip's title is a snapshot taken at insertion
 * time, not a live lookup — this is what keeps it in sync when the target
 * page gets renamed later. Safe against a chip's HTML attribute order
 * varying (Tiptap's own serialization vs. hand-authored seed HTML don't
 * necessarily match byte-for-byte) since it reuses the same
 * order-independent matching as `extractPageLinkIdsFromHtml`. Chips are
 * Tiptap `atom` nodes — no nested markup ever lives inside one — so a
 * plain-text replacement between the tags is safe without a full HTML
 * parser.
 */
export function updateWikilinkTitlesInHtml(
  html: string,
  pageId: string,
  newTitle: string,
): string {
  const escapedId = pageId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(<span\\b(?=[^>]*\\bdata-page-link\\b)(?=[^>]*\\bdata-page-id="${escapedId}")[^>]*>)([^<]*)(</span>)`,
    "g",
  );
  return html.replace(
    pattern,
    (_match, openTag: string, _oldText: string, closeTag: string) =>
      `${openTag}↗ ${newTitle}${closeTag}`,
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Searchable plain text for a block, regardless of its content shape. */
export function extractPlainText(block: Block): string {
  const { content } = block;
  if (typeof content.html === "string") return stripHtml(content.html);
  if (typeof content.code === "string") return content.code;
  if (Array.isArray(content.rows)) {
    return (content.rows as string[][]).flat().join(" ");
  }
  if (typeof content.alt === "string" || typeof content.caption === "string") {
    return [content.alt, content.caption].filter(Boolean).join(" ");
  }
  if (Array.isArray(content.columns)) {
    const columns = content.columns as { title: string; cards: { title: string }[] }[];
    const words: string[] = [];
    for (const col of columns) {
      words.push(col.title);
      for (const card of col.cards) words.push(card.title);
    }
    return words.join(" ");
  }
  return "";
}

/** Short excerpt around a match, with an ellipsis on whichever side got cut off. */
export function buildSnippet(text: string, matchIndex: number, matchLength: number): string {
  const radius = 40;
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + matchLength + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

/**
 * Rewrites the first plain-text occurrence of `targetTitle` inside `html`
 * into a real [[wikilink]] chip pointing at `targetPageId` — the "Link"
 * action behind the Unlinked Mentions panel. Returns `null` if no match is
 * found (the mention may have been edited away since it was detected).
 *
 * Walks the HTML as a real DOM tree rather than string-matching it
 * directly, so a match that happens to span a tag boundary (e.g. across
 * bold/italic marks) is handled correctly, and an existing chip's own
 * label text is never re-linked. This module only ever runs in a browser
 * or jsdom (never Node/SSR), so `document` is always available. Matching
 * is a case-insensitive substring, the same trade-off `api/search.ts`
 * already makes — not a whole-word match, so a title that's a substring of
 * an unrelated word can also match.
 */
export function insertWikilinkForMention(
  html: string,
  targetPageId: string,
  targetTitle: string,
): string | null {
  const needle = targetTitle.trim().toLowerCase();
  if (!needle) return null;

  const container = document.createElement("div");
  container.innerHTML = html;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let match: { node: Text; index: number } | null = null;
  for (
    let node = walker.nextNode() as Text | null;
    node;
    node = walker.nextNode() as Text | null
  ) {
    if (node.parentElement?.closest("[data-page-link]")) continue; // never re-link a chip's own label
    const index = node.data.toLowerCase().indexOf(needle);
    if (index !== -1) {
      match = { node, index };
      break;
    }
  }
  if (!match) return null;

  const matchedNode = match.node.splitText(match.index);
  matchedNode.splitText(needle.length);
  const chip = document.createElement("span");
  chip.setAttribute("data-page-link", "");
  chip.setAttribute("data-page-id", targetPageId);
  chip.className = "page-link-chip";
  chip.textContent = `↗ ${targetTitle}`;
  matchedNode.replaceWith(chip);

  return container.innerHTML;
}

/**
 * Detects a `[[` or `@` mention trigger ending at the cursor, given the
 * text before it in the current block. `[[` is the primary trigger; `@`
 * is a shorter alias for the exact same insert-a-page-link flow, only
 * recognized at a word boundary (start of text or right after
 * whitespace) so it doesn't fire mid-word or inside an email address.
 * Returns the query typed after the trigger and how many characters
 * (trigger included) to delete once a page is picked — or `null` if
 * neither trigger is currently active.
 */
export function detectMentionTrigger(
  textBeforeCursor: string,
): { query: string; length: number } | null {
  const wikilinkMatch = /\[\[([^[\]]*)$/.exec(textBeforeCursor);
  if (wikilinkMatch) return { query: wikilinkMatch[1], length: wikilinkMatch[0].length };

  const atMatch = /(?:^|\s)(@[^\s@]*)$/.exec(textBeforeCursor);
  if (atMatch) return { query: atMatch[1].slice(1), length: atMatch[1].length };

  return null;
}

function domNodeToMarkdown(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  if (el.hasAttribute("data-page-link")) {
    // Obsidian-style plain-text wikilink — the "↗ " prefix is Loom's own
    // chip label styling, not part of the title.
    return `[[${(el.textContent ?? "").replace(/^↗\s*/, "")}]]`;
  }

  const inner = Array.from(el.childNodes).map(domNodeToMarkdown).join("");
  switch (el.tagName) {
    case "STRONG":
    case "B":
      return `**${inner}**`;
    case "EM":
    case "I":
      return `*${inner}*`;
    case "CODE":
      return `\`${inner}\``;
    case "S":
    case "STRIKE":
    case "DEL":
      return `~~${inner}~~`;
    case "U":
      // No native Markdown syntax for underline — raw HTML is the
      // standard fallback, and every Markdown renderer worth the name
      // (GitHub, Obsidian, ...) passes inline HTML through untouched.
      return `<u>${inner}</u>`;
    case "BR":
      return "\n";
    default:
      return inner;
  }
}

/**
 * Converts a block's rich-text HTML (the shape Tiptap produces — bold,
 * italic, code, strikethrough, underline, and wikilink chips) into inline
 * Markdown, for exporting a page. Walks a real DOM tree rather than
 * regex-replacing tags, the same approach `insertWikilinkForMention`
 * already uses, so nested marks (bold *and* italic together) come out
 * correctly instead of needing a combinatorial set of regexes.
 */
export function inlineHtmlToMarkdown(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  return Array.from(container.childNodes).map(domNodeToMarkdown).join("").trim();
}

/** Ordered top-level (or nested, via parentBlockId) blocks for a page. */
export function getOrderedBlocks(
  blocksById: Record<string, Block>,
  pageId: string,
  parentBlockId: string | null = null,
): Block[] {
  return Object.values(blocksById)
    .filter((b) => b.pageId === pageId && b.parentBlockId === parentBlockId)
    .sort((a, b) => a.order - b.order);
}

/** Every descendant id of a block (e.g. a toggle's children) — for cascade delete. */
export function getDescendantBlockIds(
  blocksById: Record<string, Block>,
  blockId: string,
): string[] {
  const result: string[] = [];
  const directChildren = Object.values(blocksById).filter((b) => b.parentBlockId === blockId);
  for (const child of directChildren) {
    result.push(child.id);
    result.push(...getDescendantBlockIds(blocksById, child.id));
  }
  return result;
}

const LIST_TYPES: BlockType[] = ["bulletList", "numberedList", "checklist"];

export type BlockRun =
  { kind: "list"; type: BlockType; blocks: Block[] } | { kind: "single"; block: Block };

/**
 * Groups consecutive same-type list blocks into one run, so BlockList can
 * wrap them in a single <ul>/<ol> instead of one per item — matters for
 * both correct semantics and for markers (1. 2. 3.) rendering right.
 */
export function groupIntoRuns(blocks: Block[]): BlockRun[] {
  const runs: BlockRun[] = [];
  for (const b of blocks) {
    const isListType = LIST_TYPES.includes(b.type);
    const last = runs.at(-1);
    if (isListType && last?.kind === "list" && last.type === b.type) {
      last.blocks.push(b);
    } else if (isListType) {
      runs.push({ kind: "list", type: b.type, blocks: [b] });
    } else {
      runs.push({ kind: "single", block: b });
    }
  }
  return runs;
}
