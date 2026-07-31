# workspace

**Implemented (Phase 2):** `PageTree` — the sidebar's page tree. Reads
`pagesById` from `usePageStore` and derives the nested tree at render time
via `lib/tree.ts` (never stored nested). Handles its own loading skeleton,
error, and empty states; "+ New page" creates a root-level page.

**Still ahead:** a workspace switcher UI (single default workspace for now),
drag-to-reorder (Phase 6+).
