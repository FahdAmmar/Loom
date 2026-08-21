# editor

**Implemented (Phase 3):**

- `Editor` / `BlockList` / `BlockRow` — the block tree for a page. Blocks are
  a flat, ordered array per page (grouped into runs for rendering, never
  stored nested except for genuine parent/child cases like Toggle)
- 12 block types: paragraph, heading 1–3, bulleted/numbered/checklist,
  quote, callout, code, divider, image (URL-based), table, toggle
- `BlockTextEditor` — one Tiptap instance per text-bearing block (bold,
  italic, underline, strike, inline code, with built-in markdown shortcuts
  like `**bold**`); each block owns its own tiny instance rather than the
  whole page being one big document
- Slash command menu (`/`) — filtered by what you type after it, positioned
  at the text cursor via Tiptap's `coordsAtPos`
- Enter creates the next block (list types continue as the same list type);
  Backspace on an empty block deletes it and refocuses the previous one;
  Arrow Up/Down move between blocks at their start/end
- Move up/down and delete via a hover-revealed rail (no drag-and-drop —
  see the top-level README's scope note)
- Autosave: optimistic + debounced (600ms) per block, with a **flush on
  navigation** so an edit made just before leaving the page isn't lost —
  this was a real bug caught and fixed during this phase, not a
  hypothetical one
- `useEditorStore` fully implemented (was a skeleton through Phase 1–2)

**Still ahead:** mentions and tags inside blocks (Phase 6), real image
upload once a backend exists, drag-and-drop reordering, richer tables
(merge/resize/delete row-col).

**Implemented (Phase 4):**

- `nodes/pageLinkNode.ts` — a custom Tiptap atom node for `[[wikilinks]]`.
  Renders as a clickable chip; round-trips through stored HTML via
  `data-page-id`. The chip's label is a snapshot of the target page's title
  _at insertion time_ — renaming a page later doesn't retroactively update
  chips that already point to it elsewhere. Fixing that needs a NodeView
  that subscribes to the page store live, which felt like more machinery
  than this phase warranted
- Trigger detection reuses the same `onUpdate`-text-inspection technique as
  the slash menu (not Tiptap's official Suggestion/Mention extensions) —
  one less API surface to wire up, and `[[` can trigger anywhere in a
  block's text, not just at the start, unlike `/`
- Clicking a chip navigates via `editorProps.handleClickOn` — a plain click
  inside a contentEditable region normally just moves the cursor, so this is
  the specific hook that intercepts clicks landing on the node itself
- Link extraction happens against plain stored HTML (`extractPageLinkIdsFromHtml`
  in `lib/blocks.ts`), not Tiptap's JSON — keeps `useEditorStore`'s save
  flow decoupled from ProseMirror's document shape entirely

**Implemented (Phase 7):**

- Reading width: the editor body and `PageHeader` now share a `max-w-3xl`
  wrapper, so lines don't stretch full-width on a wide monitor — matches the
  brief's explicit "content width" requirement, which had been missed since
  Phase 3
- `BlockRow`'s `blocksById` subscription narrowed from the whole map to a
  single derived boolean (`hasChildren`, only computed for toggle blocks) —
  Zustand skips re-rendering a component when a selector's return value is
  unchanged, so this stops _every_ block on a page from re-rendering on
  every keystroke typed into any one of them. `BlockRow` and `ListRunItem`
  are also wrapped in `memo` as a second line of defense, since unrelated
  block objects keep the same reference across an edit to a different block
- `BlockList`'s `getOrderedBlocks`/`groupIntoRuns` pass is now `useMemo`'d
  against `blocksById` — the same O(n log n) re-scan doesn't need to happen
  on a re-render triggered by something other than this page's own blocks
  changing
- Dropdown menus (the block's `···` menu) now animate in/out via plain CSS
  keyframes keyed on Radix's `data-state` attribute — no `tailwindcss-animate`
  dependency needed; Radix's own `Presence` component already keeps the
  content mounted for the duration of a running exit animation
- Page-to-page navigation (clicking a `[[wikilink]]` chip, moving between
  blocks) uses React Router 8's built-in `viewTransition` option, which
  wraps the update in the native View Transitions API when the browser
  supports it — a soft cross-fade instead of an instant swap, with zero
  animation library and a clean no-op fallback where unsupported

**Implemented (later addition): "board" block type.**

- A 13th block type — a small Kanban board embedded in a page. Content
  shape is `{ columns: BoardColumn[] }`, self-contained in one block like
  `table`'s `{ rows }`, not a separate set of tables
- `BoardBlockView.tsx` — columns and cards both drag-and-drop via
  `@dnd-kit/core` + `@dnd-kit/sortable`: reorder cards within a column,
  move them across columns, reorder columns themselves. `DragOverlay` gives
  the dragged card a proper floating preview instead of just hiding/showing
  the original in place
  - Cards have a dedicated small grip handle (visible on hover), not the
    whole card body — the title `<input>` already covers most of a card's
    width, so making the _entire_ card draggable directly conflicts with
    clicking in to edit text. Same pattern as the column header's handle
  - `PointerSensor` uses an 8px activation distance so clicking into a
    title input to edit it doesn't get misread as the start of a drag
  - An empty column is still droppable (`useSortable` on a
    `col-drop-<columnId>` id wrapping the card list) — otherwise a column
    with zero cards has nothing for `closestCorners` to detect a drop
    against
  - Per-card icon picker (curated emoji set via the existing
    `DropdownMenu`) and a per-column icon (e.g. "✅" on Done) — the brief
    asked for "more icons and organized," not just bare text rows
  - Column colors reuse the same gold/violet/mint rotation as tags
    (`lib/tagColors.ts`'s palette), not a new ad-hoc color set
- `lib/blocks.ts`'s `extractPlainText` extended to cover board content
  (column + card titles) — otherwise search silently couldn't find
  anything typed into a board, since it only recognized `html`/`code`/
  `rows`/`alt`+`caption` shapes before this
- **Bug found and fixed while building this** (pre-existing, not
  board-specific): `changeBlockType` didn't cancel a block's pending
  debounced `updateBlockContent` save before converting it. Typing
  `/board` (or any slash command) queues a 600ms-debounced content-only
  save on every keystroke; selecting the command converts the block
  correctly, but the _stale_ debounced save was still armed and fired
  ~600ms later, silently overwriting the new content (type stayed right,
  content reverted to the pre-conversion text) — reproducible on **every**
  slash-command conversion, not just board, whenever a command is picked
  within 600ms of the last keystroke (i.e., normal use). Fixed by clearing
  the pending save for that block id at the start of `changeBlockType`.

**Implemented (later addition): block drag-and-drop.**

One `DndContext` lives at the top of `Editor.tsx`, wrapping the whole page's
block tree; each `BlockList` (there's one per page, plus one more per
expanded toggle, since toggle children render via a nested `BlockList`)
contributes its own `SortableContext` scoped to just its own blocks. A
block only ever reorders among its own siblings — a top-level block among
other top-level blocks, a toggle's children among each other — dragging
never moves a block into a different parent. That's a deliberate scope cut,
not a limitation of `@dnd-kit`: re-parenting a block via drag (e.g. into or
out of a toggle) raises questions a simple brief doesn't answer (does the
rest of the toggle's content move with it? does dropping "near" a toggle
mean before it or inside it?) that the page tree's equivalent feature
answers by being a strictly two-level structure. Blocks aren't.

The drag handle is a separate small grip icon, not the whole block/card
surface — same reasoning as the board's cards: the block's own
`BlockTextEditor` needs the row to stay normally clickable for editing, so
`{...listeners}` lives only on the handle, not on any element a click
should just edit text on.

`api/blocks.ts` `reorderBlock` and `lib/utils.ts` `arrayMove` share the
exact index convention `@dnd-kit/sortable`'s own `arrayMove` uses (the
target's raw index in the _current_ list, not adjusted for which side of
it the drag started from) — worth calling out because `api/pages.ts`
`movePage` deliberately does _not_ use this convention (see that file's
doc comment for why: a page can change parents mid-drag, a block never
does, and that difference is what makes the simpler convention insufficient
there).

**Implemented (later addition): keyboard support for every drag surface.**
All three drag-and-drop contexts (blocks here, the board, and the page
tree in `features/workspace/`) originally shipped with `PointerSensor`
only — mouse/touch-operable, with no keyboard path at all. Added
`KeyboardSensor` + `sortableKeyboardCoordinates` to all three: Tab to a
grip handle, Space/Enter to pick up, arrow keys to move, Space/Enter to
drop, Escape to cancel — `@dnd-kit`'s own standard interaction, not
something hand-rolled here.

Two real bugs surfaced while verifying this, neither one hypothetical:

- Every grip handle was `opacity-0 group-hover:opacity-100` — invisible
  until moused over, with nothing making it appear on keyboard focus. A
  keyboard user could still technically operate it (focus doesn't require
  visibility), but couldn't see what they were about to grab. Fixed by
  adding `focus-visible:opacity-100` alongside the hover state on every
  handle.
- The page tree's drop-zone math (top/bottom quarter reorders, middle
  half nests — see the workspace README) is built on pointer position:
  where the dragged item's rect sits relative to the target's. A
  keyboard-driven drag doesn't produce that gradual sweep — dnd-kit snaps
  the active item's rect to align with whatever it's being compared
  against, which centers it almost exactly over the target. Feeding that
  into the same pointer-zone math landed in the "nest" zone on nearly
  every keyboard move: pressing ArrowUp once to reorder a page actually
  re-parented it instead. Confirmed via an actual keyboard-only drag in a
  real browser, not just read from the code. Fixed by branching on
  `event.activatorEvent instanceof KeyboardEvent` — a keyboard drag always
  reorders as a sibling; nesting via keyboard isn't supported by this
  simpler tree yet, and says so in the code rather than silently
  misbehaving.

**Implemented (later addition): real image upload.** `ImageBlockView`'s
edit form now offers both an "Upload a file" button and the original
paste-a-URL input, not a replacement of one by the other. An uploaded file
is read via `FileReader.readAsDataURL` and stored as a `data:` URI directly
in the block's `content.url` — the same field a pasted URL already used, so
no schema change — since there's no backend to actually upload to. Capped
at 1.5MB per file: the data-URI encoding itself adds ~33% overhead on top
of the original file size, and everything shares one `localStorage` quota
(commonly ~5MB per origin) with every other page's content, so one large
image could otherwise crowd out a meaningful fraction of it.

**Implemented (later addition): heading accessibility.** heading1/2/3 are
Tiptap "paragraph" nodes wearing Tailwind classes (`text-2xl font-bold`
etc.), not real `<h1>`-`<h6>` elements — `Heading` is disabled in
`StarterKit.configure` since each block is its own independent Tiptap
document with no concept of "this document's h1 vs h2." Without something
conveying heading semantics, a screen reader had no way to navigate the
page by heading at all. `BlockTextEditor` now sets `role="heading"` +
`aria-level` on the contenteditable element itself, kept in sync via
`editor.setOptions()` in a `useEffect` (not a dependency array on
`useEditor` — that would recreate the whole ProseMirror instance on every
heading-level change, dropping cursor position and undo history for no
reason).

Found and fixed a second, pre-existing bug while verifying this:
`aria-label` was set unconditionally to the placeholder text (e.g.
`"Heading 1"`) on every block, at all times — not just while empty.
`aria-label` always wins over an element's actual text content when
computing its accessible name, so a screen reader would have announced the
placeholder forever, never the real content, for every block type
(paragraphs included, not just headings) — this wasn't specific to the
heading fix, just surfaced while testing it. Fixed by only setting
`aria-label` while the block is actually empty.

One honest limitation, not papered over: Chromium exposes a
`contenteditable` element's text via the accessibility node's `value`
field, not `name`, once it also carries an ARIA role — confirmed via
`page.accessibility.snapshot()` during testing (level and structure come
through correctly; the exact "name vs. value" split for an editable
heading is a genuinely unsettled pattern across screen readers, not a
gap specific to this implementation).
