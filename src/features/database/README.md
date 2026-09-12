# database

A `database` block renders a live table of the page it lives on's direct
sub-pages — the "child pages become rows" pattern from Notion's linked
databases, without a separately stored schema.

**No shared schema exists.** `PageProperty` records are created
independently per page (see `api/pageProperties.ts` — each one has its own
`pageId`, there's no `Database { propertyDefs: [...] }` table tying a set
of pages to a shared set of columns). Rather than adding one — a real
architectural change, with migration and consistency implications — the
table's columns are **derived**: the union of every distinct property key
found across the current sub-pages, computed fresh on every render
(`deriveTableColumns` in `tableUtils.ts`). This is a genuine trade-off, not
a hidden shortcut — it's called out in the top-level README's Known
Limitations, and it means:

- Two sub-pages can technically have the same property key with two
  different types; whichever one is encountered first wins for that
  column, and this isn't reconciled or validated
- A newly added column needs at least one row to exist first
  (`addPropertyToPages` needs somewhere to put the new property) — the "+
  Add column" control is disabled on an empty table for exactly this
  reason, not left silently broken

**Avoiding N+1.** A table of _N_ rows needing each row's properties would
naively be _N_ separate fetches. `pageProperties.ts` gained
`getPropertiesForPages(pageIds)`, a single bulk read the mock API layer
filters server-side-style — the same shape a real backend's bulk endpoint
would have. `addPropertyToPages` mirrors this for writes: adding a column
creates the property on every current row in one call, not one round trip
per row.

**`DatabaseBlockView` vs. `TableView`.** The block wrapper owns data
(reads `pagesById` from the store for rows, fetches properties, computes
columns) and knows nothing about how a view renders it. `TableView` owns
rendering and interaction (sort state, inline editing, add row/column) and
knows nothing about where its data came from. This split exists
specifically so a future `BoardView`/`CalendarView` can sit next to
`TableView` behind the same data layer, switched by the block's
`viewType`, rather than needing their own parallel fetch-and-derive logic.

**Sorting is in-memory UI state, not persisted** on the block — reopening
a page resets to the original (creation) order. A real caught bug during
testing: the first version of descending sort did `[...ascending].reverse()`,
which correctly reverses real values but also drags pages with no value
for that column from the bottom (correct) to the top (wrong). Fixed by
partitioning valued/unvalued pages before sorting instead of reversing the
whole result — see `sortPagesByColumn` and its tests.

**Not built (yet):** Board and Calendar view types — `viewType` on the
block's content already anticipates them, but only `"table"` renders
today.
