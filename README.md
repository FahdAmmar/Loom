<div align="center">

# 🧵 Loom

**A calm knowledge workspace — structured pages woven into a living graph of ideas.**

Notion's page hierarchy. Obsidian's connected graph. One product, one interface.

<br/>

![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-433E38?style=flat-square)
![React Router](https://img.shields.io/badge/React_Router-8-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Tiptap](https://img.shields.io/badge/Tiptap-3-8B5CF6?style=flat-square)
![d3--force](https://img.shields.io/badge/d3--force-3-F9A03C?style=flat-square&logo=d3dotjs&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?style=flat-square&logo=vitest&logoColor=white)

![Build](https://img.shields.io/badge/build-passing-1e9c74?style=flat-square)
![Typecheck](https://img.shields.io/badge/typecheck-strict%20%E2%9C%93-1e9c74?style=flat-square)
![Lint](https://img.shields.io/badge/lint-0%20errors-1e9c74?style=flat-square)
![Tests](https://img.shields.io/badge/tests-223%20passing-1e9c74?style=flat-square)
![License](https://img.shields.io/badge/license-unlicensed-6c6d82?style=flat-square)

</div>

<div align="center">
  <img src="./public/loom.png" alt="Loom app screenshot" width="900" />
</div>

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Routes](#routes)
- [Testing](#testing)
- [Design system & theming](#design-system--theming)
- [Accessibility](#accessibility)
- [Roadmap & project status](#roadmap--project-status)
- [Known limitations](#known-limitations)
- [Notable design decisions](#notable-design-decisions)
- [License](#license)

## Overview

Most note-taking tools force a choice: organize your thinking into neat,
structured pages, or let it sprawl into a web of connected ideas. **Loom
doesn't make you choose.** Every page is both at once — a document you can
nest, rename, and browse like a filing cabinet, _and_ a node in a graph
that grows automatically as you write and link.

The app runs entirely client-side. There is no server to deploy or
database to provision — data is persisted to the browser's IndexedDB
behind an API layer that mirrors the exact shape a real REST backend would
have, so wiring up a real one later touches only three files (see
[Architecture](#architecture)).

## Features

### 🗂️ Workspace & pages

- Nested pages at unlimited depth — create, rename, and delete from the
  sidebar or the page itself
- Cascading delete with a confirmation dialog stating exactly how many
  sub-pages will be removed
- A breadcrumb trail computed live from the page tree — never stored,
  always accurate
- **Favorites** — star any page from its actions menu; a dedicated
  sidebar section appears once you have at least one
- **Recents** — the last 8 pages you opened, tracked automatically and
  persisted across sessions
- **Daily Notes** — a sidebar shortcut (and a `⌘K` command) opens today's
  note, creating it on first visit; a regular page underneath, so it's
  freely renamable, linkable, and searchable like any other
- **Version history** — save a manual checkpoint of a page from its
  actions menu, browse past ones, and restore any of them. Restoring
  always saves the state it's about to overwrite first, so it's never a
  dead end
- Loading, empty, and "page no longer exists" states everywhere a page
  might legitimately be missing

### ✍️ Block editor

- **17 block types**: paragraph, heading 1–3, bulleted list, numbered
  list, checklist, quote, callout, code, divider, toggle (with nested
  children), image, table, board (Kanban), embed (YouTube), and database
  (a live table of a page's sub-pages)
- `/` opens a filtered slash-command menu positioned at the text cursor
- Type `@` (after whitespace, so it doesn't fire mid-word or inside an
  email address) as a shorter alias for `[[` — both trigger the exact
  same page-link menu
- Inline formatting — bold, italic, underline, strikethrough, inline
  code — via familiar Markdown shortcuts (`**bold**`, `` `code` ``)
- <kbd>Enter</kbd> / <kbd>Backspace</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd>
  split, merge, and move between blocks the way any modern block editor
  behaves
- Drag-and-drop block reordering (pointer, touch, and keyboard via
  `@dnd-kit`)
- Autosave: debounced and optimistic per block, with a flush-on-navigate
  so a last-second edit is never dropped

### ⭐ Tags, properties & templates

- Tag any page with existing tags or create new ones inline from the page
  header — a type-to-filter picker, not a plain multi-select
- A dedicated Tags gallery lists every tag with its page count
- Typed page properties — text, number, date, select, checkbox
- Save any page as a reusable template; 8 built-in templates ship out of
  the box (including two board-based ones), shown as a visual gallery

### 📊 Database views

- A `/database` block turns any page into a live table of its own
  sub-pages — add a sub-page and it's a new row, no manual linking
- Columns aren't a separately configured schema — they're the union of
  whatever properties the sub-pages already happen to have, computed at
  render time from the same `PageProperty` records the page header's
  property list already uses
- Click a column header to sort (ascending → descending → back to
  original order); "+ Add column" creates that property on every current
  row at once so it's immediately fillable
- A cell for a page that doesn't have that property yet shows a one-click
  "Set value" instead of leaving it silently blank

### 📝 Markdown import & export

- **Export** any page from its actions menu — every block type renders to
  standard Markdown (GFM tables, fenced code with its language, task
  lists, `[[wikilinks]]` in Obsidian's own plain-text syntax), downloaded
  as a `.md` file with no round trip through a server
- **Import** a `.md` file from `⌘K` → "Import Markdown file…" — parsed
  with `marked`, not hand-rolled, since parsing arbitrary third-party
  Markdown (unlike generating it) is a genuinely well-solved problem not
  worth reinventing
- A `[[Title]]` in an imported file resolves to an existing page by title
  if one matches, or creates a new (empty) page for it automatically —
  the same "link creates the page" behavior Obsidian itself has
- A leading `# Heading` becomes the new page's title rather than a
  redundant first block, mirroring exactly what export produces

### 🔗 Linking & the knowledge graph

- Type `[[` (or `@`) anywhere to link to another page; it renders as a
  clickable chip, not a raw URL
- Every page shows a **Backlinks** panel — every other page linking to
  it, one click back
- The same panel also surfaces **unlinked mentions**: other pages that
  mention this one's title in plain text without an actual link. A "Link"
  button converts the match into a real `[[wikilink]]` chip in place, no
  retyping
- A full-screen **Graph View** with live physics: every page is a node,
  every link a directional edge, laid out by a continuous `d3-force`
  simulation that settles naturally and reheats when you drag a node.
  Pan, zoom, search-to-highlight, filter by tag, hover to see a node's
  neighborhood

### ⌘ Search & command palette

- <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> opens one unified, keyboard-navigable
  list — search and commands together, no separate modes
- **Fuzzy matching** (via Fuse.js) across page **titles and content**,
  not just what's already rendered in the sidebar — tolerates a typo or
  two and ranks title matches above content matches
- Doubles as a command runner: create a page, jump to the Graph, jump to
  Settings, toggle the sidebar or theme
- A query with no match offers "Create page '…'" inline
- <kbd>⌘N</kbd> creates a page from anywhere; <kbd>⌘S</kbd> is safely
  intercepted so the browser's native Save dialog never interrupts typing

### 🎨 Design system & data portability

- Light / Dark / System theme, persisted, zero flash on load
- A from-scratch token system (Ink/Paper backgrounds, Thread Gold,
  Structure Violet, Growth Mint accents) mapped onto Tailwind's `@theme`
- Fully responsive: a collapsible desktop sidebar, a native
  `<dialog>`-based mobile drawer
- Workspace export/import as JSON, plus a one-click "reset to demo
  content"

## Tech stack

| Layer                 | Choice                                          | Why                                                                                                                                                                          |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build tool            | **Vite 8**                                      | Instant HMR, first-class TypeScript support                                                                                                                                  |
| UI                    | **React 19**                                    | Function components accept `ref` as a normal prop — no `forwardRef` boilerplate                                                                                              |
| Language              | **TypeScript** (strict mode)                    | A shared domain model (`Page`, `Block`, `Link`, …) spans the UI, state, and API layers                                                                                       |
| Styling               | **Tailwind CSS v4**                             | CSS-first `@theme` config — the entire design system lives in `src/index.css`, no separate config file                                                                       |
| Client state          | **Zustand**                                     | Seven small, single-purpose stores instead of one global one — see [Architecture](#architecture)                                                                             |
| Routing               | **React Router 8**                              | Absorbed `react-router-dom` into the main package; ships built-in View Transitions support                                                                                   |
| HTTP client           | **Axios**                                       | One centralized instance with interceptors — no component imports it directly                                                                                                |
| Persistence           | **IndexedDB** (native)                          | A hand-rolled key-value wrapper (`api/idbStorage.ts`) backs the mock "database" — no dependency needed for three promisified calls                                           |
| Rich text             | **Tiptap 3**                                    | A battle-tested ProseMirror wrapper for cursor handling, IME, and paste behavior                                                                                             |
| Graph physics         | **d3-force**                                    | Just the force-simulation engine, not the rest of D3                                                                                                                         |
| Fuzzy search          | **Fuse.js**                                     | Typo-tolerant title/content ranking for `⌘K` — hand-rolling a scoring algorithm wasn't worth it for something this well-solved                                               |
| Markdown import       | **marked**                                      | Parses arbitrary third-party Markdown into a token tree; export goes the other way with hand-rolled logic, since that side only ever deals with Loom's own known HTML shapes |
| Drag & drop           | **@dnd-kit** (core, sortable, utilities)        | Maintained, accessible; powers the page tree, block reordering, and the board block                                                                                          |
| Accessible primitives | **Radix UI** (Dropdown Menu, Slot)              | Correct keyboard behavior (arrow keys, typeahead, focus return) for real menus                                                                                               |
| Component conventions | **shadcn/ui-style, hand-built**                 | `components.json` is configured so `npx shadcn add` drops in cleanly if needed later                                                                                         |
| Linting               | **oxlint**                                      | Fast, with a native `jsx-a11y` plugin for accessibility linting                                                                                                              |
| Testing               | **Vitest** + Testing Library + `fake-indexeddb` | Shares Vite's config and transform pipeline directly; the IndexedDB polyfill lets persistence tests run against jsdom                                                        |
| Formatting            | **Prettier** + `prettier-plugin-tailwindcss`    | Utility class lists sorted automatically                                                                                                                                     |

## Getting started

### Prerequisites

- Node.js 20 or later (LTS recommended)
- npm (ships with Node)

### Install & run

```bash
npm install
npm run dev        # start the dev server, then open the printed localhost URL
```

There's nothing else to configure and no backend to stand up. On first
run, the app seeds itself with a starter workspace (10 pages, tags, page
properties, and 8 templates) directly in your browser's IndexedDB.
If it ever looks empty or stuck after experimenting with import/export,
**Settings → Reset to demo content** restores it without clearing storage
by hand.

## Available scripts

| Script                 | Does what                                       |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Vite dev server with hot module reload          |
| `npm run build`        | Type-check (`tsc -b`) + production build        |
| `npm run preview`      | Serve the production build locally              |
| `npm run typecheck`    | `tsc -b --noEmit` — type-check without emitting |
| `npm run lint`         | oxlint (React + TypeScript + `jsx-a11y` rules)  |
| `npm run test`         | Run the Vitest suite once                       |
| `npm run test:watch`   | Run Vitest in watch mode                        |
| `npm run format`       | Prettier — write                                |
| `npm run format:check` | Prettier — check only (used as a CI-style gate) |

All four gates — `typecheck`, `lint`, `test`, and `build` — currently
pass clean; see [Testing](#testing) for what the suite covers.

## Project structure

```text
src/
├── api/                  # The only layer allowed to touch persistence directly
│   ├── client.ts           #   Centralized Axios instance + interceptors
│   ├── _mockDb.ts           #   In-memory "database" + seed data, persisted to IndexedDB
│   ├── idbStorage.ts         #   Tiny native IndexedDB key-value wrapper (get/set/delete)
│   └── pages.ts, blocks.ts, links.ts, workspaces.ts, search.ts,
│       tags.ts, pageProperties.ts, templates.ts, backup.ts, dailyNotes.ts,
│       pageVersions.ts
│                            #   Domain modules — same async shape a real API would have
├── components/
│   ├── EmptyState.tsx       #   Shared across every "nothing here yet" screen
│   └── ui/                  #   Hand-built shadcn/ui-style primitives (Button, Dialog, …)
├── features/                # Feature-first — each folder owns its components + a README
│   ├── workspace/             #   Page tree, Favorites, Recents, Daily Notes
│   ├── pages/                  #   Page-entity UI: header, tags, properties, actions menu
│   ├── editor/                  #   The block editor — the largest feature
│   ├── database/                 #   The database-view block: derived columns, sortable table
│   ├── markdown/                  #   Page ⇄ Markdown conversion (export and import)
│   ├── graph/                      #   Force-directed Graph View
│   ├── search/                      #   The ⌘K command palette
│   ├── templates/                    #   Template gallery
│   └── settings/                      #   Appearance and data settings
├── hooks/                    # useMediaQuery, useTheme, useDialogElement,
│                              # useGlobalShortcuts, useToast
├── layouts/                  # AppShell, Sidebar, Topbar
├── lib/                      # Pure functions: tree.ts, blocks.ts, tagColors.ts,
│                              # utils.ts, youtube.ts, downloadFile.ts
│                              #   (page tree, block ordering, and link extraction are all
│                              #    *derived views* computed here — never stored nested)
├── routes/                   # One file per route (see Routes below)
├── stores/                   # Seven Zustand stores, one responsibility each
├── test/                     # Vitest setup + shared fixtures
├── types/                    # entities.ts — the shared domain model
├── index.css                 # The entire design system: tokens, both themes, base layer
├── App.tsx                   # Route table
└── main.tsx                  # Entry point
```

## Architecture

**There's no real backend, on purpose — every layer is written as if
there were one.** `api/pages.ts`, `api/blocks.ts`, and `api/links.ts`
expose plain `async` functions with the exact shape a real REST call
would have, with a simulated network delay so loading states get
exercised honestly instead of resolving instantly. The day a real backend
exists, only those files change — nothing else in the app needs to know.

Underneath, `api/_mockDb.ts` holds the "database" as a single object in
memory and persists it to **IndexedDB** (via the small wrapper in
`api/idbStorage.ts`) in the background. `mockDb.read()`/`write()` stay
synchronous — every domain module above calls them exactly like it always
has — while `initDb()` hydrates that in-memory copy from IndexedDB once,
before the app renders (see `main.tsx`). A one-time migration path reads
any data left over from the project's earlier localStorage-backed version
and moves it into IndexedDB automatically, so upgrading never loses a
user's workspace. IndexedDB's per-origin quota is a large fraction of free
disk space rather than the few megabytes `localStorage` allows, which is
what makes larger image uploads and future features like version history
practical.

**Derived data is never stored twice.** This shows up throughout the
codebase:

- The page **tree** isn't stored nested — it's computed from a flat
  `pagesById` map by `lib/tree.ts` on every render
- **Backlinks** aren't their own table — they're `Link` records filtered
  by `targetPageId`, computed in `api/links.ts`
- The **Graph View**'s nodes and edges aren't stored either — they're
  pages and links, laid out live by a force simulation

Renaming a page, deleting a block, or forming a new link can never leave
two copies of the truth out of sync, because there's only ever one copy.

**State is split by who actually needs it.** Seven Zustand stores
(`useSettingsStore`, `useSidebarStore`, `useWorkspaceStore`,
`usePageStore`, `useEditorStore`, `useSearchStore`, `useTagStore`) instead
of one global store, so a component that only cares about the theme
doesn't re-render when a block's text changes three pages away. Purely
local UI state (a graph's zoom level, a palette's current query) stays in
`useState` rather than Zustand.

## Routes

| Route                          | Renders                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `/`                            | Redirects to `/w/default`                               |
| `/w/:workspaceId`              | Workspace root — empty state or new-page call-to-action |
| `/w/:workspaceId/p/:pageId`    | Full page: header, tags, properties, editor, backlinks  |
| `/w/:workspaceId/graph`        | The interactive knowledge graph                         |
| `/w/:workspaceId/tags/:tagId?` | Tag gallery, or pages filtered by one tag               |
| `/w/:workspaceId/templates`    | Template gallery — use or delete                        |
| `/settings/:tab?`              | Settings                                                |
| `*`                            | Not-found page                                          |

## Testing

```bash
npm run test        # 223 tests across 17 suites
```

The suite deliberately focuses on the highest value-per-line code, not
blanket coverage:

- **`lib/*.ts`** — pure functions: page-tree building/flattening, block
  ordering, wikilink extraction, `arrayMove`, the `[[`/`@` mention
  trigger detector (including the word-boundary rule that keeps `@` from
  firing inside an email address), and YouTube URL parsing across every
  shape the site itself produces (watch, `youtu.be`, embed, Shorts)
- **`api/pages.ts`, `api/blocks.ts`** — CRUD plus the two things most
  likely to silently break in a mock persistence layer: cascade deletes
  and reordering
- **`api/idbStorage.ts`, `api/_mockDb.ts`** — the IndexedDB adapter's
  get/set/delete round-trip, plus `initDb()`'s three startup paths: fresh
  seed, migrating a pre-existing localStorage database, and preferring
  data already in IndexedDB over reseeding it
- **`api/links.ts`, `api/search.ts`** — unlinked-mention detection and its
  one-click "convert to a real link" action (including the DOM-walking
  edge case of a match landing right at an inline-formatting tag
  boundary), and fuzzy title/content ranking
- **`api/dailyNotes.ts`** — date-key formatting (including zero-padding),
  and that a second visit the same day returns the existing note instead
  of creating a duplicate
- **`features/database/tableUtils.ts`** — derived-column computation and
  every value type's sort order, including a real bug caught by its own
  test before shipping: a naive `.reverse()` for descending sort pushed
  pages with no value for that column to the top instead of keeping them
  pinned at the bottom
- **`api/pageVersions.ts`** — snapshot/restore/prune, including that a
  saved version is a true independent copy (mutating the live block
  afterward doesn't change it), and that restoring an old block re-syncs
  its `[[links]]` instead of leaving them pointing at nothing
- **`features/markdown/exportMarkdown.ts`, `features/markdown/importMarkdown.ts`**
  — every block type in both directions, nested-mark combinations (bold
  _and_ italic), wikilink round-tripping, and that an unresolvable
  `[[Title]]` on import stays as visible plain text instead of a dead link
- **`stores/useEditorStore.ts`, `stores/usePageStore.ts`** — two
  regression tests, each verified to fail against the pre-fix code before
  being kept

jsdom doesn't implement IndexedDB, so tests run against `fake-indexeddb`
(a devDependency, wired in via `src/test/setup.ts`) — the real persistence
code path executes in every test run, not just a mocked stand-in for it.

**Not covered, by choice:** component/UI tests. Testing Library is
installed and ready, but interactive flows (drag-and-drop, the editor,
forms) were verified through manual browser testing during development
rather than automated component tests.

## Design system & theming

The entire visual system lives in `src/index.css` as CSS custom properties
consumed through Tailwind v4's `@theme inline`, so there is no separate
`tailwind.config.js` to keep in sync.

- **Light / Dark / System** modes, applied before React mounts to avoid a
  flash of the wrong theme, kept in sync with `useSettingsStore`
- Three brand accents — **Thread Gold**, **Structure Violet**, **Growth
  Mint** — used sparingly for graph edges, links, and status states
- Every color pair in both themes was checked against WCAG AA's 4.5:1
  text-contrast threshold using the actual relative-luminance math; five
  token values that looked fine by eye were quietly failing and were
  corrected

## Accessibility

- Native `<dialog>` for modals and the mobile drawer (free focus trap,
  native <kbd>Esc</kbd>-to-close), native `<input type="checkbox">` for
  checklist items
- `role="listbox"`/`"option"` only where a native element genuinely can't
  do the job — for example a menu that renders icon rows and stays
  positioned at a text cursor
- A real skip-to-content link and keyboard-reachable retry buttons on
  every error state
- Drag-and-drop reordering supports pointer, touch, _and_ keyboard
  (`@dnd-kit`'s `KeyboardSensor`)
- **Honest limitation, documented rather than hidden:** the Graph View is
  a visual, spatial diagram with no meaningful screen-reader equivalent.
  It says so, and points back to the sidebar's page list instead of
  pretending an ARIA role fixes it

## Roadmap & project status

| Phase | Focus                                                           | Status  |
| ----- | --------------------------------------------------------------- | ------- |
| 1     | Foundation — tooling, theme system, base layout                 | ✅ Done |
| 2     | Workspace — pages, tree, nesting, CRUD                          | ✅ Done |
| 3     | Editor — blocks, slash commands, formatting, autosave           | ✅ Done |
| 4     | Knowledge graph — `[[links]]`, backlinks, graph view            | ✅ Done |
| 5     | Search — search index, `⌘K` command palette                     | ✅ Done |
| 6     | Productivity — favorites, recents, tags, templates, properties  | ✅ Done |
| 7     | Polish — responsive pass, animation, accessibility, performance | ✅ Done |

**Added beyond the original scope:** a Kanban "board" block type; JSON
workspace export/import with a one-click demo reset; drag-and-drop
reordering (with re-parenting) for pages and blocks, replacing an earlier
move-up/move-down-only design; real client-side image upload (data URI,
since there's no backend); TypeScript strict mode; the current Vitest
suite; persistence moved from `localStorage` to IndexedDB (with an
automatic one-time migration for existing data); Fuse.js-based fuzzy
search; unlinked-mention detection with a one-click "convert to a real
link" action; Daily Notes; `@` as a shorter alias for `[[` to trigger the
page-link menu; a YouTube embed block; a database block with a sortable
table view of a page's sub-pages; manual version history with one-click
restore; and Markdown export/import, including `[[wikilink]]` resolution
that creates a page on demand if none matches.

**Deliberately out of scope**, not just deferred:

- **A real backend** — the `api/*.ts` layer is written to the exact shape
  a real HTTP call would have specifically so this swap stays contained
- **Multi-user collaboration** — presence, live cursors, and conflict
  resolution are a substantial project of their own
- **A workspace switcher** — this build is single-workspace by design

## Known limitations

- **Markdown import/export isn't a lossless round trip for every block
  type** — a callout and a plain quote both export the same way and both
  import as a quote; a toggle's `<details>` export doesn't reconstruct
  back into a toggle; a board exports as headings and lists, not back
  into a board; a hyperlink imports as plain text with the URL dropped
  (the editor has no hyperlink mark to put it in). Full detail and the
  reasoning behind each in `features/markdown/README.md`
- **Version history only saves a checkpoint when you ask it to** — there's
  no automatic periodic snapshotting, so a page you never manually
  checkpoint has no history to fall back on. A deliberate trade-off to
  avoid timers and change-diffing, not an oversight
- **A database block's columns aren't a real, stored schema** — they're
  derived from whatever properties the sub-pages already happen to have,
  since `PageProperty` records are created independently per page with no
  shared schema tying a set of them together. Two sub-pages can have the
  same property key with two different types with nothing to catch it,
  and a brand-new column needs at least one existing row to attach to
  (see `features/database/README.md`)
- **Only a table view exists** for database blocks — `viewType` on the
  block's content anticipates Board and Calendar, but only `"table"`
  renders today
- **The embed block only recognizes YouTube URLs**, not generic oEmbed
  providers (Vimeo, Twitter/X, etc.) — narrower than a real "embed
  anything" feature, but avoids trusting third-party HTML (see
  [Notable design decisions](#notable-design-decisions))
- **Wikilink chip labels are a snapshot**, not a live lookup — renaming a
  page updates every chip that points to it (handled explicitly in
  `renamePage`), but this is a deliberate simpler alternative to a fully
  reactive `NodeView`
- **Templates only capture a page's top-level blocks** — a toggle block's
  nested children don't currently survive being saved into a template
- **Unlinked-mention matching is a case-insensitive substring**, the same
  trade-off search makes — a short title that's a substring of an
  unrelated word (e.g. "Cat" inside "Concatenate") can surface as a false
  positive. A minimum title length filters out the noisiest cases, not all
  of them
- **Two production bundles exceed 500 kB** pre-gzip (`Editor` and the
  main entry chunk) — a candidate for further route-level code-splitting
  if the app grows
- **A known `@tiptap/core` advisory** (`GHSA-cp6q-959q-f8rh`,
  `GHSA-j95f-988m-3j2f`) affects the currently pinned Tiptap 3.29 range;
  `npm audit` flags it. Bumping to `@tiptap/*@^3.31` clears it — not yet
  applied here since it wasn't in scope for this change

## Notable design decisions

A short list of choices that deviate from the obvious default, for anyone
extending this codebase:

- **Native `<dialog>`** for the mobile drawer and confirmation dialogs
  instead of `@radix-ui/react-dialog` — a real top-layer modal with a
  free focus trap and native Escape-handling, with no extra dependency
- **`@radix-ui/react-dropdown-menu` was added**, unlike the dialog above
  — correct keyboard behavior for a real menu is a much bigger lift to
  hand-roll correctly
- **`d3-force` was added, but not the rest of D3** — the physics engine
  is the part worth not hand-rolling; pan/zoom is simple enough as plain
  SVG transforms
- **`Fuse.js` was added for search, but IndexedDB persistence wasn't given
  its own library** — a scoring/ranking algorithm is worth not
  hand-rolling; three promisified calls around the native IndexedDB API
  isn't
- **Unlinked-mention linking walks a real, detached DOM tree**
  (`document.createElement("div")` + `TreeWalker`) instead of
  string-matching the raw HTML — this module only ever runs in a browser
  or jsdom, so `document` is always available, and it's the only way to
  safely handle a match that lands right at a tag boundary (e.g. spanning
  into bold text) without a full HTML parser dependency
- **The embed block parses the video id itself and builds its own
  `<iframe src>`, rather than fetching YouTube's oEmbed endpoint and
  rendering the HTML it returns** — trusting and injecting a third
  party's HTML response is a real XSS surface; a regex-validated 11
  -character id substituted into a fixed URL template isn't
- **A database block's columns are derived, not a stored schema** — given
  properties are already created independently per page with no shared
  schema, adding one (a `Database { propertyDefs }` table, migrations,
  reconciliation) was a bigger architectural change than the feature
  needed; computing the column union at render time needed nothing new
  and can't drift out of sync with the pages it's reading
- **A saved version deep-clones its blocks with `structuredClone`**
  instead of storing the live objects — `reorderBlock` and friends mutate
  block objects in place before replacing them in the store; without a
  real copy, a "historical" snapshot could silently drift as later edits
  touched the same object references
- **Restoring a version re-syncs links from HTML rather than restoring
  the old `Link` records directly** — deleting a block already cleans up
  its links elsewhere in the app, so a block coming back from an old
  snapshot needs its links re-derived from its content, the same as any
  other edit; assuming old link rows were still valid would leave
  backlinks quietly stale
- **Markdown export is hand-rolled; Markdown import uses `marked`** —
  export only ever converts HTML Loom's own editor produced (a small,
  fully known tag set); import has to handle Markdown from anywhere, and
  parsing arbitrary third-party Markdown correctly is exactly the kind of
  well-solved problem not worth a worse reimplementation. See
  `features/markdown/README.md` for the full reasoning, including why one
  loop in the import path stays sequential while a similar-looking one
  right next to it runs in parallel
- **Graph node positions update imperatively** (direct `setAttribute`
  calls in the simulation's tick callback via element refs), not through
  `setState` — the standard pattern for 60fps d3 animation inside React
  without a full re-render on every tick
- **Wikilink insertion watches plain text on `onUpdate`** rather than
  using Tiptap's Suggestion/Mention extensions — one less API surface,
  and `[[` needs to trigger mid-sentence
- **Tag colors auto-assign** from a fixed 3-color rotation instead of a
  color picker — one less decision when creating a tag
- **`react-router@8`** instead of `react-router-dom` — v8 folded the DOM
  package into the main export
- **`oxlint`** instead of ESLint — faster, with `jsx-a11y` support
  built in, avoiding a second tool

## License

No license file is currently included in this repository. Add one (MIT,
Apache-2.0, or similar) before distributing or open-sourcing the project.
