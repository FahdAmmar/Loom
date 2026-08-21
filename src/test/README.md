# Testing

**Implemented (later addition):** Vitest, configured directly in
`vite.config.ts` (a `test` field alongside the existing Vite config, per
Vitest's own recommended setup — one config file, one transform pipeline,
nothing to keep in sync between two tools). `src/test/setup.ts` wires in
`@testing-library/jest-dom`'s matchers and mocks `networkDelay` globally
(the mock API layer's artificial latency is worth exercising honestly in
the real app; it's just dead weight in a test run) — that one change took
the suite from ~18s to ~2s without touching what any test actually
verifies.

## What's covered, and why this scope specifically

- **`lib/*.ts`** — pure functions, the highest value-per-line tests in the
  codebase: page tree building/flattening, block ordering and grouping,
  wikilink extraction, `extractPlainText` (including the board-content
  case, easy to silently forget when a new block type is added), the
  shared `arrayMove` helper.
- **`api/pages.ts`, `api/blocks.ts`** — CRUD plus the two things most
  likely to silently break in a mock persistence layer as it grows:
  cascade deletes (a page's descendants, a page's blocks, links touching
  either side) and reordering (`moveBlock`'s swap, `reorderBlock` and
  `movePage`'s arbitrary-distance moves). Each test file uses a workspace
  id distinct from `"default"` specifically so it's isolated from the demo
  content that auto-seeds on first `localStorage` read — no test depends
  on the seed's specific pages, only on the operations under test.
- **`stores/useEditorStore.ts`, `stores/usePageStore.ts`** — two
  regression tests protect two bugs found and fixed elsewhere in this
  project (see the `editor` and `templates` feature READMEs for the
  bugs themselves): `changeBlockType`'s debounce-cancellation, and
  `addPage` syncing a template-created page into the store. Both tests
  were verified to actually fail against the pre-fix code before being
  kept, not just written to match whatever the fixed code already did.

**Not covered, on purpose:** component/UI tests (React Testing Library is
installed and ready — `@testing-library/react` — but nothing exercises it
yet). Every interactive feature in this codebase (drag-and-drop, the block
editor, forms) was instead verified with real browser automation during
development: actual mouse-down/move/up sequences for drag gestures, real
file uploads, checking the persisted data afterward rather than just the
DOM. That's a better tool for "does this feel right and actually work end
to end" than a jsdom component test would be, but it isn't checked into
the repo as a regression suite the way the Vitest tests are — a
reasonable next addition if this project keeps growing, using Playwright
or similar rather than jsdom-based component tests for anything
drag-and-drop-shaped, since jsdom doesn't lay out real pixels and
`@dnd-kit` cares where things actually are on screen.

## Running

```bash
npm run test        # run once (also what CI-style gates should use)
npm run test:watch  # watch mode while developing
```
