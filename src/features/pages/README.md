# pages

**Implemented (Phase 2):**

- `PageTreeItem` — one recursive row: expand/collapse, navigate, hover-reveal
  add-subpage and the actions menu
- `PageHeader` — breadcrumbs (derived via `getAncestors`), inline-editable
  title, actions menu, save-status indicator (Phase 3)
- `PageActionsMenu` — shared add-subpage/delete + its confirmation dialog,
  used by both of the above so the logic exists once
- `PageTreeSkeleton` — loading placeholder

**Implemented (Phase 4):**

- `BacklinksPanel` — "linked from N pages," fetched once per page view via
  local state (read-only, single-consumer data doesn't need a global store).
  Nothing renders at all if there are zero backlinks, rather than showing an
  empty section

The `[[wikilink]]` chip itself — the trigger detection, suggestion menu, and
the Tiptap node that renders it — lives in `features/editor/`, since it's
fundamentally an editing-surface concern; this feature only consumes the
`Link` records it produces.

**Still ahead:** favoriting and reordering (Phase 6+ — deliberately not
built yet, see the top-level README's scope notes).
