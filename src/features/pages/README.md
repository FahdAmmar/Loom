# pages

**Implemented (Phase 2):**

- `PageTreeItem` — one recursive row: expand/collapse, navigate, hover-reveal
  add-subpage and the actions menu
- `PageHeader` — breadcrumbs (derived via `getAncestors`), inline-editable
  title, actions menu
- `PageActionsMenu` — shared add-subpage/delete + its confirmation dialog,
  used by both of the above so the logic exists once
- `PageTreeSkeleton` — loading placeholder

**Still ahead:** the block editor body (Phase 3), backlinks panel (Phase 4),
favoriting and reordering (Phase 6+ — deliberately not built yet, see the
top-level README's "deliberate deviations" section).
