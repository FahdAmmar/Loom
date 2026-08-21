# workspace

**Implemented (Phase 2):** `PageTree` — the sidebar's page tree. Reads
`pagesById` from `usePageStore` and derives the nested tree at render time
via `lib/tree.ts` (never stored nested). Handles its own loading skeleton,
error, and empty states; "+ New page" creates a root-level page.

**Implemented (Phase 6):**

- `FavoritesList` — flat list of favorited pages (not nested), hidden
  entirely when there are none. Favoriting itself happens from
  `PageActionsMenu` in `features/pages/`, shared with the tree row and the
  page header
- `RecentsList` — recently visited pages, sourced from `usePageStore`'s
  persisted `recentPageIds`, recorded by `PageRoute` on every successful
  page load

**Implemented (later addition): drag-and-drop, replacing the "still ahead"
note this used to end on.**

The tree is flattened once per render (`lib/tree.ts` `flattenVisibleTree`
— collapsed branches are left out entirely, not just hidden) into the one
flat array `@dnd-kit/sortable`'s `SortableContext` needs. Dropping a page
is a single gesture that means one of two things depending on _where_
within the target row it lands:

- top or bottom quarter of the row → reorder as a sibling, before/after it
- middle half → nest as a new child of that row

The zone is computed from `active.rect.current.translated` vs. `over.rect`
in `onDragEnd`, not from a second UI control — a real page tree is
expected to support both reordering and re-parenting off one drag.
`api/pages.ts` `movePage` does the actual mutation and rejects (via
`ApiError`) dropping a page inside its own subtree; `lib/tree.ts`
`getDescendantIds` is checked client-side too, so a doomed drop never even
flashes into place before reverting.

Keyboard-operable too (`KeyboardSensor`, Tab → Space → arrows → Space) —
reordering only, not the pointer-position-based nesting zone above; see
the `editor` feature README for why that specific split exists and the
bug that surfaced while adding it.

**Still ahead:** a workspace switcher UI (single default workspace for
now).
