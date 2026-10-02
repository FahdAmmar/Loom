# Phases 7-8 — Page style + Text highlight (changed files only)

Copy over the same paths. Apply AFTER Phases 1-6. No dependency changes (highlight is a small custom Tiptap mark; no @tiptap/extension-highlight needed).

## Page style (Type icon in the page header)
- Per page: font (Default / Serif / Mono), text size (Small / Default / Large), width (Standard / Full width).
- Header and editor share one hook (`usePageLayout`) so they always agree. Headings are now em-based so they scale with the text size (identical at the default 16px).
- Stored in a separate persisted store (`loom-page-view` in localStorage), NOT on the Page entity: this avoids touching types/api that differ in your real project.

## Highlight
- Selection toolbar -> Highlighter -> 4 colors (yellow/green/blue/pink), pick the applied color again to clear, or use the eraser. Stored as `<mark data-color="...">` in the block HTML; unknown colors fall back to yellow.
- Colors are design tokens with separate light/dark values; text stays `inherit`. Highlights keep their background when printing.

## Known limitations
- Page style is per device/browser: it is not exported, backed up, duplicated with the page, or synced. Moving it onto the Page entity later is a small change once the real types are at hand.
- Highlight export: `inlineHtmlToMarkdown` isn't in the uploaded snapshot, so I couldn't check how `<mark>` comes out in Markdown export. Please test one export; if it leaks tags, strip `<mark>` there.
- The toolbar's color picker isn't unit-tested (Tiptap's BubbleMenu needs real layout); the mark itself is (apply, switch, remove, unknown-color fallback).
- Not viewed in a browser: check both themes for highlight legibility and the dialog on a phone width.
