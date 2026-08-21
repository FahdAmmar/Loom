# templates

**Implemented (Phase 6):**

- `api/templates.ts` — save a page's blocks as a reusable `Template`, then
  stamp out new pages from it
- `TemplatesRoute` — gallery (name + block count), "Use template" creates a
  page and navigates straight to it, delete removes a template
- "Save as template" lives in the shared `PageActionsMenu` (`features/pages/`)
- Eight ready-made templates ship in the seed data out of the box: Meeting
  notes, Project brief, Weekly planner, Reading notes, Design critique,
  Todo board, Bug tracker, Daily journal — covering headings, tables,
  checklists, numbered lists, quotes, callouts, and (the last two of the
  eight) the board block type

**Implemented (later addition): board-based templates.** Todo board and Bug
tracker both include a `board` block — unlike a toggle, a board's
"children" (columns, cards) all live nested inside that one block's own
`content`, not as separate child blocks, so it fits the existing flat
`Template.blocks` shape with no changes needed (see the known limitation
below, which is specifically about _block_ nesting, not content nesting
within a single block). `TemplatesRoute`'s gallery now shows a small icon
per template — a Kanban icon for anything containing a board block, a
plain document icon otherwise — derived from `template.blocks` rather than
a new field, since it's worth being able to tell at a glance which
templates are board-based as the gallery grows past a handful of entries.

**Fixed:** `handleUse` created the page through `templatesApi` directly,
bypassing `usePageStore` — the new page was persisted but the store's
`pagesById` cache never learned about it, so the router's page lookup (and
the sidebar tree) couldn't see it and showed "This page doesn't exist."
Fixed by adding a small `addPage` action to `usePageStore` and calling it
right after creation.

**Known limitation:** only a page's _top-level_ blocks are captured.
`Template.blocks` (Phase 0 data model) has no parent-child shape, so a
toggle's nested children don't survive being saved into a template. Building
that shape out felt like more scope than "save my meeting-notes structure"
templates need right now.
