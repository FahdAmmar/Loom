# search

**Implemented (Phase 5):**

- `CommandPalette` — the `⌘K` / `Ctrl+K` surface. One unified, keyboard-navigable
  list: static actions (new page, open Graph, open Settings, toggle sidebar,
  toggle theme) plus live page search results, plus a synthetic "Create page
  '<query>'" entry when nothing matches exactly
- `api/search.ts` — scans page titles first (a title match short-circuits
  that page's blocks — no need to also report a content match), then block
  content via `lib/blocks.ts`'s `extractPlainText`, which pulls searchable
  text out of every block type regardless of its content shape (stripped
  HTML for text blocks, raw text for code, flattened cells for tables, alt
  text for images)
- `useGlobalShortcuts` — `⌘K` toggles the palette, `⌘N` creates a page from
  anywhere, `⌘S` is swallowed so the browser's native Save dialog doesn't
  interrupt typing (autosave already covers persistence, so there's nothing
  else for it to do)

**Architecture note:** `useSearchStore` shrank instead of growing this phase —
the original Phase 1 skeleton had `query` living in the store, but building
the real palette showed that only `isCommandPaletteOpen` is genuinely
cross-component (it has to open from the Topbar button _and_ a global
keyboard shortcut). The query text and results are local `useState` inside
`CommandPalette` — the same lesson Phase 4's `GraphView` already taught about
single-consumer, ephemeral UI state.

**Implemented (Phase 6):** the palette now shows recent pages (from
`usePageStore`'s persisted `recentPageIds`) whenever the query is empty,
instead of just the static action list.

**Still ahead:** tag search (typing a tag name doesn't surface pages tagged
with it yet — only title/content matches do).
