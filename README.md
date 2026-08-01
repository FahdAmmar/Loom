# Loom

A calm knowledge workspace — structured pages woven into a living graph of ideas.

This is **Phase 3 — Editor** of the 7-phase roadmap. Pages now have real,
editable content: a block editor with formatting, slash commands, and
autosave. Linking pages together and the visual graph are next, in Phase 4.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS v4 · Zustand · Axios ·
React Router v8 · Radix UI (Slot, Dropdown Menu) · **Tiptap** (per-block
inline rich text) · hand-built shadcn/ui-style primitives

## Getting started

```bash
npm install
npm run dev       # start the dev server
```

Open the seeded "Welcome to Loom" page to see the editor with real content —
headings, a callout, lists, a checklist, a quote, and a code block.

## Scripts

| Script                 | Does what                                           |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                            |
| `npm run build`        | Type-check (`tsc -b`) + production build            |
| `npm run preview`      | Serve the production build locally                  |
| `npm run lint`         | oxlint (react + typescript + jsx-a11y plugins)      |
| `npm run format`       | Prettier — write                                    |
| `npm run format:check` | Prettier — check only (used as a verification gate) |

All three gates (`build`, `lint`, `format:check`) pass clean, and `npm audit`
reports 0 vulnerabilities.

## What's actually working right now

**From Phase 1–2:** theme system, responsive `AppShell`, page tree with
create/delete/rename/navigate, breadcrumbs.

**New in Phase 3 — the block editor:**

- 12 block types (see `src/features/editor/README.md` for the full list)
  with a `/` command menu to insert or convert any block
- Inline formatting via Tiptap: bold, italic, underline, strikethrough,
  inline code — typed with markdown shortcuts (`**bold**`, `` `code` ``),
  not a toolbar
- Keyboard flow between blocks: Enter, Backspace-to-delete-and-merge-focus,
  Arrow Up/Down
- Move up/down and delete per block via a hover rail
- Real autosave: debounced 600ms, "Saving…/Saved" shown in the page header,
  and — this mattered enough to fix mid-phase — **edits are flushed
  immediately if you navigate away before the debounce fires**, so a fast
  page switch can't silently drop your last keystroke

## A note on scope: what Phase 3 deliberately does _not_ include

The roadmap's Phase 3 bullets are **Editor, Blocks, Slash commands,
Formatting, Markdown support, Autosave** — all present. Left out on purpose:

- **No `[[wikilinks]]`, mentions, or tags inside block content** — these are
  explicitly Phase 4 (links/backlinks/graph) and Phase 6 (tags) in the
  roadmap, confirmed with you before starting this phase
- **No drag-and-drop block reordering** — move up/down buttons cover
  reordering without the added complexity of a drag library; not in the
  Phase 3 roadmap bullets either
- **No real image upload** — image blocks are URL-based until a backend
  exists to receive file uploads
- **Table is intentionally basic** — add row/column only, no merge, resize,
  or delete

## Judgment calls worth flagging

- **Tiptap, one instance per block** — not one big document. This is the
  standard way to build Notion-style block editors on Tiptap: it lets each
  block have its own undo scope and made the "block type" system (which is
  fully custom, not Tiptap nodes) straightforward — Tiptap only owns the
  _inline_ marks, never the block-level structure.
- **Content is stored as HTML, not markdown strings** — Tiptap's native
  format is HTML (`getHTML()`/`content:`); "Markdown support" is satisfied
  through Tiptap's built-in input rules (typing `**x**` produces real bold),
  not by round-tripping a custom markdown serializer.
- **List items skip the hover-action rail** other blocks get — a `<li>`
  must be a direct child of `<ul>/<ol>`, so an extra wrapper `<div>` for
  hover controls isn't valid there. List items still fully support
  creation, deletion, and the slash menu; just not the move-up/down buttons.
- **A real bug was caught and fixed**: the first draft of autosave cancelled
  a pending save entirely when you navigated to a different page within the
  600ms debounce window. Fixed by flushing (persisting immediately) instead
  of just cancelling — see `useEditorStore.clear()`.
- Carried over: `src/routes/` naming, `react-router@8.3.0` (CVE), oxlint,
  native `<dialog>` for the confirm dialog, Radix for the dropdown menu.

## Next up

**Phase 4 — Knowledge Graph**: `[[wikilinks]]` inside blocks, a backlinks
panel, and the visual graph view — the two-strands vision (structured pages

- a living graph) actually connecting for the first time.
