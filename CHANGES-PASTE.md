# Phase 2 — Smart paste (changed files only)

Copy over the same paths. Apply AFTER Phase 1. No dependency changes (uses your existing `marked` via importMarkdown.ts).

Pasting into a text block now:
- Markdown (headings, lists, checklists, quotes, code fences, tables) -> real blocks, `[[Page]]` links resolved to existing pages.
- A lone YouTube URL -> video embed block.
- An image (screenshot / copied image, no text on the clipboard) -> image block, same 1.5 MB cap as uploads.
- Plain text with blank lines -> one paragraph block per paragraph.
- Rich HTML from web/Word/Excel keeps the editor's own handling (except VS Code, whose plain-text copies are treated as source).
Empty block -> replaced by the first pasted block; otherwise blocks are inserted after it. Max 100 blocks per paste.

Refactor: the duplicated upload helpers in ImageBlockView/FileBlockView moved to `features/editor/uploads.ts`.

## Requirements / known limitations
- Needs `BlockType` to include "embed" (your exportMarkdown.ts already assumes it). The uploaded snapshot's entities.ts lacks it, so typecheck reports 1 error there (pasteBlocks.ts) until your real types are in place.
- Pasting into the MIDDLE of a non-empty block inserts the blocks after it; the block's own text is not split.
- Inline-only Markdown (**bold**, [link](url)) with no block markers is left to the default paste.
- Blocks are created one request at a time (no batch API in the snapshot), so a large paste appears progressively.
- Not exercised in a real browser (no clipboard events in jsdom): logic is covered by unit tests, the Tiptap wiring is not.
