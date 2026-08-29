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
within a single block).

**Implemented (later addition): visual gallery, replacing the plain
name-and-icon list.** `TemplatePreview` (new,
`features/templates/components/`) renders a small schematic SVG thumbnail
of a template's actual `blocks` — a bold bar for a heading, a tiny grid for
a table, three colored columns for a board, and so on — not a static image
saved anywhere. That means it can never drift out of sync with what "Use
template" actually produces, and a template saved later from a real page
(`PageActionsMenu`'s "Save as template") gets a correct preview for free
with no image to generate or store. Uses the app's CSS custom properties
directly (`var(--foreground)`, `var(--brand-gold)`, etc.) so it follows
dark mode the same way the rest of the app does, with no separate
light/dark handling of its own. Truncates with a fade at the bottom rather
than overflowing once a template has more blocks than the thumbnail has
room for.

`TemplatesRoute` is now a responsive grid of cards instead of a vertical
list. The whole card is a button (click anywhere to use the template, not
just a "Use template" label); hovering reveals that label as an overlay on
the preview plus a delete icon in the corner. The delete button is a
sibling positioned over the card, not a descendant of it — nesting a
`<button>` inside another `<button>` is invalid HTML, and this was the
simplest way around that without giving up a fully-clickable card.

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
