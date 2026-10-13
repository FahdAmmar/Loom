# Changelog

Release notes for Loom, newest first. Each entry lists what changed and the limitations that are still true today. Project-wide limitations live in the [root README](../README.md).

## Maintenance

- Added `.nvmrc` (Node 24 LTS) and a troubleshooting entry for Vitest workers that exit at startup, which was reported on Windows with Node 26.x. The test suite passes (70 files, 565 tests) on Linux with Node 22.22.3, 24.21.0 and 26.11.1; the Windows crash has not been reproduced or root-caused.
- Deployment configuration: SPA fallback, long-lived caching for hashed assets, no-cache for the service worker and manifest, and basic security headers (`public/_redirects`, `public/_headers`, `vercel.json`). See "Deployment" in the root README.
- Patched `source-map-js` 1.2.1 → 1.2.2 in `package-lock.json` (GHSA-68fv-2mgg-jv7q); `npm audit` reports 0 vulnerabilities.
- Documentation reorganized under `docs/`: one changelog (this file), a documentation index and a skills guide.
- Moved the unused promo banner out of `public/` so it no longer ships in every build (about 1.5 MB).
- Root README: merged the two deployment sections, added technology badges, a troubleshooting table and the full list of verification commands. Documented that `npx tsc --noEmit` checks no files because the root `tsconfig.json` is a solution file; `npm run typecheck` is the real type check.

## Roadmap release

**Added**

- **Reliability:** every secondary screen is lazy-loaded with vendor chunks (main bundle 619 kB → 293 kB), the Trash screen is reachable from the sidebar, and backup files are validated with a Zod schema before a restore.
- **Editor:** syntax-highlighted code blocks, math equations (KaTeX), page covers, an image enlarge dialog, and YouTube embed and database blocks insertable from the slash menu.
- **Database view:** filters and group-by next to the existing sorting.
- **Workspace:** Tasks hub, daily-notes calendar (the Daily Notes list is mounted in the sidebar), four accent colors.
- **Data:** export a page as Markdown or HTML, export everything as a Markdown ZIP, import Markdown files, and a storage / offline / last-backup panel in Settings.
- **Quality:** axe accessibility tests, 17 Playwright browser tests, a bundled Arabic web font.
- **Dependencies:** Tiptap aligned on 3.31.4 (with an explicit `@tiptap/pm`), Vitest 4.1.11, jsdom 30.1.2. Development needs Node.js 22.22.2 or newer because of jsdom.

**Known limitations**

- Markdown import creates flat top-level pages and does not read `$$` equations back.
- Mermaid diagrams, tabs and split view are not included.
- Color contrast is checked by eye in a browser, not by axe (jsdom has no styles).
- Nothing was tested on a real phone, Safari or Firefox; the e2e suite runs in Chromium only.
- With npm 10, `npm install <pkg>` could crash with `Cannot read properties of null (reading 'edgesOut')` because the resolver pulled in Vitest 5 while walking optional peers. The lockfile was merged by hand and installs cleanly with `npm ci`.
- The lazy-loaded editor chunk (Tiptap and ProseMirror) is about 511 kB, which triggers Vite's 500 kB warning. It is only downloaded when a page is opened.

## Phases 7–8 — Page style and text highlight

- **Page style** (Type icon in the page header): per-page font (Default / Serif / Mono), text size (Small / Default / Large) and width (Standard / Full width). The header and editor share one hook, `usePageLayout`. Headings are em-based so they scale with the text size.
- Stored in a separate persisted store (`loom-page-view` in localStorage), not on the `Page` entity.
- **Highlight:** selection toolbar → Highlighter → four colors (yellow, green, blue, pink). Pick the applied color again or use the eraser to clear. Stored as `<mark data-color="...">`; unknown colors fall back to yellow. Colors are design tokens with separate light and dark values, and highlights keep their background when printing.
- A small custom Tiptap mark is used, so `@tiptap/extension-highlight` is not needed.

**Known limitations**

- Page style is per device and browser: it is not exported, backed up, duplicated with the page or synced.
- Markdown export keeps the text of a highlight but drops the highlight itself.
- The toolbar's color picker is not unit-tested (Tiptap's BubbleMenu needs real layout); the mark itself is.
- Highlight legibility in both themes and the page-style dialog at phone width are checked by eye only.

## Phases 5–6 — Focus mode and Print / PDF

- **Focus mode:** `⌘⇧F` / `Ctrl+Shift+F`, a top-bar button, or "Toggle focus mode" in the command palette hides the top bar and sidebar. A dimmed "Exit focus" button stays in the corner. Session-only, not persisted.
- **Print / Save as PDF:** page menu → "Print / Save as PDF" (or the browser's `⌘P`). The page flows across paper, blocks avoid splitting, app chrome is hidden, and the dark theme switches to light while printing (`beforeprint` / `afterprint`).

**Known limitations**

- Not tried in a real print preview (jsdom has no layout or print). Check long pages, tables, images and dark mode.
- `Escape` does not exit focus mode (it would clash with the slash menu and dialogs); use `⌘⇧F` or the button.
- Pages print without a header or footer of their own; the browser adds its own.

## Phase 4 — Page outline

- "On this page" panel above the editor when a page has two or more headings (H1–H3, including inside expanded toggles). Collapsible, keyboard accessible and RTL-safe.
- Click scrolls smoothly (instantly when the user prefers reduced motion). The current section is highlighted with bold and a border, not color alone, via `IntersectionObserver`.
- Derived from blocks on every render and never stored. Headings inside collapsed toggles are omitted.
- `BlockRow` gets `data-block-id` and `scroll-mt-20` so headings land below the top bar.

**Known limitations**

- Inline panel, not a floating side rail.
- Not checked with real scrolling (jsdom has no layout); the active-section logic is untested beyond its guards.

## Phase 3 — Undo / redo across blocks

- `⌘Z` / `⌘⇧Z` (`Ctrl+Y`) undo and redo structural edits: add, delete, convert type, move (menu and drag-and-drop) and paste (one step for the whole paste).
- Typing keeps each block's own undo; when a block has nothing left to undo, `⌘Z` falls through to the block-level history.
- Undo / Redo buttons in the page header (labels show what will be reversed; they work on touch devices).
- History is per page (cleared on navigation) and capped at 100 steps.
- Delete keeps text typed less than 600 ms earlier and cancels its queued save (previously could flash "Couldn't save"). The delete toast's Undo and `⌘Z` no longer double-restore.

**Known limitations**

- Content edits of non-text blocks (table cells, board cards, code, image caption) are not in this history; their inputs use the browser's own undo.
- Moving between different parents and page-level actions (rename, tags, move page) are not covered.
- Covered by unit tests only (history logic and shortcut hook); not exercised in a real browser.

## Phase 2 — Smart paste

Pasting into a text block now produces:

- Markdown (headings, lists, checklists, quotes, code fences, tables) → real blocks, with `[[Page]]` links resolved to existing pages.
- A lone YouTube URL → a video embed block.
- A copied image (no text on the clipboard) → an image block, with the same 1.5 MB cap as uploads.
- Plain text with blank lines → one paragraph block per paragraph.
- Rich HTML from the web, Word or Excel keeps the editor's own handling (except VS Code, whose plain-text copies are treated as source).

An empty block is replaced by the first pasted block; otherwise blocks are inserted after it. Maximum 100 blocks per paste.

Refactor: the duplicated upload helpers in `ImageBlockView` and `FileBlockView` moved to `features/editor/uploads.ts`.

**Known limitations**

- Pasting into the middle of a non-empty block inserts the blocks after it; the block's own text is not split.
- Inline-only Markdown (`**bold**`, `[link](url)`) with no block markers is left to the default paste.
- Blocks are created one request at a time (no batch API), so a large paste appears progressively.
- Clipboard events are not exercised in jsdom or the e2e suite; the logic is unit-tested, the Tiptap wiring is not.

## Phase 1 — RTL / Arabic support

- Settings → "Language & direction" mirrors the whole UI (`<html dir>` and `lang`), is persisted, and is applied before first paint (`index.html`).
- Physical Tailwind classes (`left`, `right`, `ml`, `pr`, `border-l`, `text-left`) became logical ones (`start`, `end`, `ms`, `pe`, `border-s`, `text-start`).
- `dir="auto"` on editor blocks, the page title, board, table and database inputs, and the palette search. Code blocks stay `dir="ltr"`.
- Direction-aware table column resize (drag and arrow keys), mobile drawer slide, Radix dropdown menus and chevrons (`rtl:-scale-x-100`).

**Known limitations**

- The Graph View canvas, slash and wikilink popup placement at the caret, and the quote block's border side follow the UI direction, not the block's own text direction.
