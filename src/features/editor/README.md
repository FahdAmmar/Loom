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
