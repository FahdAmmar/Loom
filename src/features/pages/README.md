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

**Implemented (Phase 6):**

- `PageActionsMenu` gained two more items: favorite toggle and "Save as
  template" — favoriting also works from the sidebar's tree row for free,
  since the menu is shared
- `PageTags` — chips + an inline picker (find-or-create) under the title.
  Enter selects the first matching suggestion if there is one, otherwise
  creates a new tag — the picker deliberately stays open after each pick so
  adding several tags in one sitting doesn't mean reopening it each time
- `PageProperties` — text/number/date/select/checkbox rows under the tags.
  "Select" properties share one small preset option list rather than each
  property defining its own choices — the Phase 0 data model never gave
  `PageProperty` an options schema, and adding one felt like scope creep for
  what's meant to be a basic property editor

**Since this list was written:** drag-to-reorder pages (see the sidebar
section) and per-property option lists have both landed.

**Select options.** A `select` property can carry its own `options: string[]`
(`PageProperty.options`), typed as a comma-separated list when the property
is added and editable afterwards from the pencil next to it. Parsing lives in
`lib/properties.ts`: trimmed, empties and case-insensitive duplicates
dropped, at most 20 options of 40 characters. A property with no options of
its own still shows the old shared preset (Not started / In progress /
Published / Archived), so every existing property behaves exactly as before.
If a property's current value stops being one of its options after an edit,
it stays in the dropdown as an extra entry rather than silently vanishing.
