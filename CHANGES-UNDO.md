# Phase 3 — Undo/Redo across blocks (changed files only)

Copy over the same paths. Apply AFTER Phases 1-2. No dependency changes.

- ⌘Z / ⌘⇧Z (Ctrl+Y) undo/redo structural edits: add block, delete, convert type (slash commands), move (menu + drag-and-drop), and paste (one step for the whole paste).
- Typing keeps each block's own undo; once a block has nothing left to undo, ⌘Z falls through to the block-level history.
- Undo/Redo buttons in the page header (labels show what will be reversed; work on touch devices).
- History is per page (cleared on navigation) and capped at 100 steps.
- Delete now keeps text typed <600ms earlier, and cancels its queued save (previously could flash "Couldn't save").
- The delete toast's Undo and ⌘Z no longer double-restore.

## Known limitations
- Content edits of non-text blocks (table cells, board cards, code, image caption) are not in this history; their inputs use the browser's own undo.
- Reordering/moving between different parents and page-level actions (rename, tags, move page) are not covered.
- Not exercised in a real browser: the key handling and buttons are covered by unit tests of the pure parts only.
