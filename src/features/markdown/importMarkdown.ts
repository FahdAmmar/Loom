import { marked } from "marked";
import type { MarkedToken, Token, Tokens } from "marked";

import type { BlockType } from "@/types/entities";

export interface BlockDraft {
  type: BlockType;
  content: Record<string, unknown>;
}

const WIKILINK_PATTERN = /\[\[([^[\]]+)\]\]/g;

/**
 * Every distinct `[[Title]]` mentioned anywhere in a Markdown document,
 * trimmed and deduplicated. Resolved against existing pages — and any
 * that don't match get created — *before* `markdownToBlocks` runs (see
 * `ImportMarkdownDialog`), so the actual conversion can stay a
 * synchronous, side-effect-free lookup rather than creating pages itself
 * mid-parse.
 */
export function extractWikilinkTitles(markdown: string): string[] {
  const titles = new Set<string>();
  for (const match of markdown.matchAll(WIKILINK_PATTERN)) {
    const title = match[1].trim();
    if (title) titles.add(title);
  }
  return [...titles];
}

/** The first top-level `# Heading`, if the document starts with one — the
 * exact shape `exportMarkdown.ts` produces. Used as the new page's title
 * instead of a generic "Untitled", and excluded from the resulting blocks
 * so it isn't duplicated as a heading too. */
export function extractTitleFromMarkdown(markdown: string): string | null {
  const tokens = marked.lexer(markdown) as MarkedToken[];
  const first = tokens.find((t) => t.type !== "space");
  if (first?.type === "heading" && first.depth === 1) {
    return inlineTokensToHtmlAsText(first.tokens);
  }
  return null;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Expands any `[[Title]]` inside a run of plain text into a real
 * wikilink chip — the import-side counterpart to `inlineHtmlToMarkdown`'s
 * "chip → [[Title]]" on export. */
function textToHtml(text: string, resolveTitle: (title: string) => string | null): string {
  return escapeHtml(text).replace(WIKILINK_PATTERN, (_match, rawTitle: string) => {
    const title = rawTitle.trim();
    const pageId = resolveTitle(title);
    // Couldn't resolve (shouldn't happen — extractWikilinkTitles + the
    // caller's resolution pass covers every match) — leave as plain text
    // rather than link to nothing.
    if (!pageId) return `[[${title}]]`;
    return `<span data-page-link="" data-page-id="${pageId}" class="page-link-chip">↗ ${title}</span>`;
  });
}

function inlineTokensToHtml(
  tokens: Token[],
  resolveTitle: (title: string) => string | null,
): string {
  return tokens
    .map((raw): string => {
      const token = raw as MarkedToken;
      switch (token.type) {
        case "text":
        case "escape":
          return textToHtml(token.text, resolveTitle);
        case "strong":
          return `<strong>${inlineTokensToHtml(token.tokens, resolveTitle)}</strong>`;
        case "em":
          return `<em>${inlineTokensToHtml(token.tokens, resolveTitle)}</em>`;
        case "codespan":
          return `<code>${escapeHtml(token.text)}</code>`;
        case "del":
          return `<s>${inlineTokensToHtml(token.tokens, resolveTitle)}</s>`;
        case "link":
          // The editor has no hyperlink mark at all (only wikilinks) —
          // keep the label, drop the URL, rather than inventing support
          // that doesn't exist elsewhere in the app.
          return inlineTokensToHtml(token.tokens, resolveTitle);
        case "br":
          return "<br>";
        default:
          // Raw inline HTML, footnotes, etc. aren't reconstructed on
          // import (see the feature README) — dropped rather than shown
          // as literal tag text.
          return "";
      }
    })
    .join("");
}

/** Same as `inlineTokensToHtml`, but for the one place a *page title*
 * (plain text, not rich content) needs building from inline tokens. */
function inlineTokensToHtmlAsText(tokens: Token[]): string {
  return tokens.map((t) => ("text" in t ? t.text : "")).join("");
}

/** A list item's real inline content lives one level down: `item.tokens`
 * is a checkbox (task lists only) followed by exactly one wrapping
 * text/paragraph token whose own `.tokens` holds the actual inline
 * content — true for both tight and loose lists. */
function listItemToHtml(
  item: Tokens.ListItem,
  resolveTitle: (title: string) => string | null,
): string {
  const contentTokens = item.tokens.filter((t) => t.type !== "checkbox");
  return contentTokens
    .flatMap((t) => ("tokens" in t && t.tokens ? t.tokens : [t]))
    .map((t) => inlineTokensToHtml([t], resolveTitle))
    .join("");
}

function tableCellText(
  tokens: Token[],
  resolveTitle: (title: string) => string | null,
): string {
  const html = inlineTokensToHtml(tokens, resolveTitle);
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent ?? "";
}

function blockTokenToDrafts(
  rawToken: Token,
  resolveTitle: (title: string) => string | null,
): BlockDraft[] {
  const token = rawToken as MarkedToken;
  switch (token.type) {
    case "heading": {
      const html = inlineTokensToHtml(token.tokens, resolveTitle);
      const type: BlockType =
        token.depth === 1 ? "heading1" : token.depth === 2 ? "heading2" : "heading3";
      return [{ type, content: { html } }];
    }

    case "paragraph": {
      // A paragraph that's *just* an image renders as Loom's image
      // block; anything else (including text with an image mixed in,
      // which Loom's editor has no inline-image support for either) is a
      // plain paragraph.
      const onlyToken = token.tokens.length === 1 ? token.tokens[0] : null;
      if (onlyToken?.type === "image") {
        return [{ type: "image", content: { url: onlyToken.href, alt: onlyToken.text } }];
      }
      return [
        {
          type: "paragraph",
          content: { html: inlineTokensToHtml(token.tokens, resolveTitle) },
        },
      ];
    }

    case "list":
      return token.items.map((item) => {
        const html = listItemToHtml(item, resolveTitle);
        if (item.task) return { type: "checklist", content: { html, checked: item.checked } };
        return { type: token.ordered ? "numberedList" : "bulletList", content: { html } };
      });

    case "blockquote": {
      // Both a plain quote and a callout export as "> ...", so there's no
      // way to tell them apart on the way back in — this always imports
      // as a quote. Documented in the feature README, not hidden.
      const inner = token.tokens.find((t) => t.type === "paragraph" || t.type === "text");
      const innerTokens = inner && "tokens" in inner && inner.tokens ? inner.tokens : [];
      return [
        { type: "quote", content: { html: inlineTokensToHtml(innerTokens, resolveTitle) } },
      ];
    }

    case "code":
      return [
        { type: "code", content: { code: token.text, language: token.lang || undefined } },
      ];

    case "table": {
      const rows = [
        token.header.map((cell) => tableCellText(cell.tokens, resolveTitle)),
        ...token.rows.map((row) => row.map((cell) => tableCellText(cell.tokens, resolveTitle))),
      ];
      return [{ type: "table", content: { rows } }];
    }

    case "hr":
      return [{ type: "divider", content: {} }];

    case "space":
      return [];

    default:
      // Anything not handled above (raw HTML blocks like an exported
      // <details> toggle, footnote definitions, ...) isn't reconstructed
      // — kept as a visible paragraph of its own raw source rather than
      // silently dropped.
      return "raw" in token && token.raw.trim()
        ? [{ type: "paragraph", content: { html: escapeHtml(token.raw.trim()) } }]
        : [];
  }
}

/**
 * Converts a Markdown document into an ordered list of block drafts
 * (type + content — no ids, no pageId, no order; the caller assigns those
 * when actually persisting them via `blocksApi.createBlocks`).
 * `resolveTitle` maps a wikilink's title to a page id — a plain
 * synchronous lookup built by the caller from `extractWikilinkTitles`,
 * not something this function creates pages through itself.
 *
 * If the document starts with a top-level heading, it's treated as the
 * page title (see `extractTitleFromMarkdown`) and excluded here so it
 * isn't duplicated as a heading block too.
 */
export function markdownToBlocks(
  markdown: string,
  resolveTitle: (title: string) => string | null,
): BlockDraft[] {
  const tokens = marked.lexer(markdown) as MarkedToken[];
  const firstContentIndex = tokens.findIndex((t) => t.type !== "space");
  const first = firstContentIndex !== -1 ? tokens[firstContentIndex] : null;
  const hasLeadingTitle = first?.type === "heading" && first.depth === 1;

  const contentTokens = hasLeadingTitle ? tokens.slice(firstContentIndex + 1) : tokens;

  return contentTokens.flatMap((token) => blockTokenToDrafts(token, resolveTitle));
}
