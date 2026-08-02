<div align="center">

# Loom

**A calm knowledge workspace — structured pages woven into a living graph of ideas.**

Notion's page structure. Obsidian's connected graph. One product, its own identity.

<img align="center" src="./public/loom.png" width='1000px' height='600px' style="margin:auto"/>

![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-433E38?style=flat-square)
![React Router](https://img.shields.io/badge/React_Router-8-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Tiptap](https://img.shields.io/badge/Tiptap-8B5CF6?style=flat-square)
![d3-force](https://img.shields.io/badge/d3--force-F9A03C?style=flat-square&logo=d3dotjs&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=flat-square)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)

![Build](https://img.shields.io/badge/build-passing-1e9c74?style=flat-square)
![Lint](https://img.shields.io/badge/lint-oxlint%20clean-1e9c74?style=flat-square)
![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-0-1e9c74?style=flat-square)
![Phase](https://img.shields.io/badge/phase-4%20of%207-9c6b23?style=flat-square)
![License](https://img.shields.io/badge/license-unlicensed-6c6d82?style=flat-square)

</div>

---

## Table of contents

- [What is Loom](#what-is-loom)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Architecture &amp; design philosophy](#architecture--design-philosophy)
- [Scripts](#scripts)
- [Development roadmap](#development-roadmap)
- [Routes](#routes)
- [Engineering judgment calls](#engineering-judgment-calls)
- [What's next](#whats-next)

---

## What is Loom

Most note-taking tools force a choice: organize your thinking into neat, structured
pages — or let it sprawl into a web of connected ideas. **Loom doesn't make you
choose.** Every page is both at once: a structured document you can nest, rename,
and navigate like a filing cabinet, _and_ a node in a graph that grows automatically
as you write and link.

The product brief behind Loom asked for something with the DNA of two well-known
tools — a page-and-workspace model, and a bidirectional linked-graph model —
without cloning either one's interface or branding. What follows is the result:
a from-scratch design system (**Ink/Paper** backgrounds, **Thread Gold**,
**Structure Violet**, **Growth Mint** accents), built up phase by phase, with
every phase's code actually working before the next one started.

> This is a **product engineering exercise built in the open**: every phase below
> shipped a real, runnable app — not a mockup — verified against a build, a
> linter, and a formatter before moving on. The READMEs in `src/features/*/`
> document what's real, what's a deliberate placeholder, and what got
> reconsidered along the way.

## Features

### 🗂️ Workspace &amp; pages

- Nested pages, unlimited depth, created/renamed/deleted from the sidebar or
  from the page itself
- Cascading delete with a confirmation dialog that tells you exactly how many
  sub-pages come with it
- Breadcrumb trail computed live from the page tree — never stored, always
  accurate
- Empty, loading, and "page no longer exists" states everywhere a page might
  legitimately not be there

### ✍️ Block editor

- 12 block types: paragraph, heading 1–3, bulleted/numbered/checklist, quote,
  callout, code, divider, toggle (with nested children), image, table
- `/` opens a filtered slash-command menu right at your cursor
- Real inline formatting — **bold**, _italic_, underline, ~~strikethrough~~,
  `inline code` — typed with familiar Markdown shortcuts (`**like this**`)
- Enter / Backspace / Arrow Up / Arrow Down all move and split blocks the way
  you'd expect from any modern block editor
- Autosave: debounced, optimistic, with a "Saving…/Saved" indicator — and a
  flush-on-navigate so a last-second edit is never silently dropped

### 🔗 Linking &amp; the knowledge graph

- Type `[[` anywhere to link to another page; the link renders as a clickable
  chip, not a raw URL
- Every page automatically shows a **Backlinks** panel — every other page
  that links to it, with one click back
- A full-screen, physics-based **Graph View**: every page is a node, every
  link is an edge, laid out with a real force simulation (not a static
  circle-of-nodes placeholder). Pan, zoom, search-to-highlight, hover a node
  to see its neighborhood, click to open

### 🎨 Design system &amp; theming

- Light / Dark / System, persisted, zero flash on load
- A from-scratch token system (not shadcn's defaults re-skinned) mapped onto
  Tailwind's `@theme`, so `bg-primary`, `text-muted-foreground`, `bg-brand-violet`
  etc. all just work
- Fully responsive: a collapsible desktop sidebar and a real `<dialog>`-based
  mobile drawer (native focus trap, native Escape-to-close)

### ♿ Accessibility, taken seriously rather than checked off

- Native `<dialog>` for modals and the mobile drawer, native `<input
type="checkbox">` for checklist items, `role="listbox"`/`"option"` (the
  documented WAI-ARIA pattern) only where a native element genuinely can't do
  the job — e.g. a menu that has to render icon rows and stay positioned at a
  text cursor
- Honest limitations are _documented_, not hidden: the Graph View is a
  visual, spatial diagram with no meaningful screen-reader equivalent — so it
  says so, and points back to the sidebar's page list instead of pretending
  an ARIA role fixes it

## Tech stack

| Layer                 | Choice                                       | Why                                                                                                                                                         |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build tool            | **Vite 8**                                   | Instant HMR, first-class TS support, the current default for new React projects                                                                             |
| UI                    | **React 19**                                 | Function components can accept `ref` as a normal prop now — no `forwardRef` boilerplate anywhere in this codebase                                           |
| Language              | **TypeScript** (strict)                      | Domain types (`Page`, `Block`, `Link`, …) shared across the UI, state, and API layers                                                                       |
| Styling               | **Tailwind CSS v4**                          | CSS-first `@theme` config — the whole design system lives in one `index.css`, no separate config file                                                       |
| Client state          | **Zustand**                                  | Seven small, single-purpose stores instead of one giant one — see [Architecture](#architecture--design-philosophy)                                          |
| Routing               | **React Router 8**                           | v8 folded `react-router-dom` into the main package, which also happened to clear a CVE that affected the dom package at the time                            |
| HTTP                  | **Axios**                                    | One centralized client with interceptors — no component ever imports it directly                                                                            |
| Rich text             | **Tiptap**                                   | Battle-tested ProseMirror wrapper — hand-rolling contentEditable behavior (cursor handling, IME, paste) is its own multi-week project even at big companies |
| Graph layout          | **d3-force**                                 | Just the physics engine, not the rest of D3 — a hand-rolled force simulation risks looking janky; this one is proven                                        |
| Accessible primitives | **Radix UI** (Slot, Dropdown Menu)           | Correct keyboard behavior for a real menu (arrow keys, typeahead, focus return) is a much bigger lift to hand-roll than it looks                            |
| Component conventions | **shadcn/ui-style, hand-built**              | `components.json` is in place so a real `npx shadcn add` drops in cleanly the moment this environment can reach `ui.shadcn.com`                             |
| Linting               | **oxlint**                                   | Vite's own current default, far faster than ESLint, and its native `--jsx-a11y-plugin` covers accessibility linting without a second tool                   |
| Formatting            | **Prettier** + `prettier-plugin-tailwindcss` | Class lists sorted automatically, zero bikeshedding                                                                                                         |

## Getting started

```bash
npm install
npm run dev       # start the dev server, then open the printed localhost URL
```

There's no backend to stand up — see [Architecture](#architecture--design-philosophy)
for how that works. The app seeds itself with a small starter workspace
("Welcome to Loom" and a couple of linked pages) on first run, stored in your
browser's `localStorage`.

## Project structure

```text
src/
├── api/                 # The only layer allowed to touch persistence directly
│   ├── client.ts         #   Centralized Axios instance + interceptors
│   ├── _mockDb.ts         #   localStorage-backed mock "database" + seed data
│   ├── pages.ts, blocks.ts, links.ts, workspaces.ts
│                          #   Domain modules — same async shape a real API would have
├── components/
│   ├── EmptyState.tsx     #   Shared across every "nothing here yet" screen
│   └── ui/                #   Hand-built shadcn/ui-style primitives (Button, Dialog, …)
├── features/              # Feature-first — each owns its components + a README
│   ├── workspace/          #   The sidebar's page tree container
│   ├── pages/               #   Page-entity UI: header, tree row, backlinks, actions menu
│   ├── editor/               #   The block editor — by far the largest feature
│   ├── graph/                 #   Force-directed Graph View
│   ├── search/, settings/, templates/
│                                #   Scaffolded now, built out in Phases 5–6
├── hooks/                  # useMediaQuery, useTheme, useDialogElement
├── layouts/                # AppShell, Sidebar, Topbar
├── lib/                    # Pure functions: tree.ts, blocks.ts, utils.ts
│                             #   (page tree, block ordering, and link extraction are all
│                             #   *derived views* computed here — never stored nested)
├── routes/                 # One file per route (see the Routes table below)
├── stores/                 # Seven Zustand stores, one responsibility each
├── types/                  # entities.ts — the shared domain model
├── index.css                # The entire design system: tokens, both themes, base layer
├── App.tsx                  # Route table
└── main.tsx                 # Entry point
```

## Architecture &amp; design philosophy

**There's no real backend, on purpose, and every layer is written as if there
were one.** `api/pages.ts`, `api/blocks.ts`, and `api/links.ts` expose plain
`async` functions with the exact shape a real REST call would have. Underneath,
they read and write a small JSON "database" in `localStorage`
(`api/_mockDb.ts`) with a simulated network delay, so loading states get
exercised honestly instead of resolving instantly every time. The day a real
backend exists, only those three files change — nothing else in the app
knows the difference.

**Derived data is never stored twice.** This is the single idea that shows up
most often across the codebase:

- The page **tree** isn't stored nested — it's computed from a flat
  `pagesById` map by `lib/tree.ts`, every render
- **Backlinks** aren't their own table — they're `Link` records filtered by
  `targetPageId`, computed in `api/links.ts`
- The **Graph View**'s nodes and edges aren't stored either — they're pages
  and links, laid out fresh by `computeGraphLayout.ts`

Store it once, derive everything else. It means renaming a page, deleting a
block, or forming a new link can never leave two copies of the truth out of
sync with each other, because there's only ever one copy.

**State is split by who actually needs it.** Seven Zustand stores
(`useSettingsStore`, `useSidebarStore`, `useWorkspaceStore`, `usePageStore`,
`useEditorStore`, `useSearchStore`, plus whatever Phase 6 needs) instead of
one big one — so a component that only cares about the theme doesn't
re-render when a block's text changes three pages away. Purely local,
single-component UI state (a graph's current zoom level, a menu's open/closed
state) stays in `useState`, not Zustand — not everything ephemeral needs to
be global.

**Every phase shipped something you could actually click on.** The roadmap
below isn't a plan that got abandoned once coding started — each phase's
commit genuinely builds, lints, and formats clean before the next one began,
and the honest gaps (a feature intentionally deferred, a small bug caught
mid-phase) are called out explicitly in this README and in
`src/features/*/README.md`, not smoothed over.

## Scripts

| Script                 | Does what                                           |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                            |
| `npm run build`        | Type-check (`tsc -b`) + production build            |
| `npm run preview`      | Serve the production build locally                  |
| `npm run lint`         | oxlint (react + typescript + jsx-a11y plugins)      |
| `npm run format`       | Prettier — write                                    |
| `npm run format:check` | Prettier — check only (used as a verification gate) |

All three gates (`build`, `lint`, `format:check`) pass clean as of this
commit, and `npm audit` reports 0 vulnerabilities.

## Development roadmap

| Phase | Focus                                                          | Status                 |
| ----- | -------------------------------------------------------------- | ---------------------- |
| 1     | Foundation — tooling, theme system, base layout                | ✅ Done                |
| 2     | Workspace — real pages, tree, nesting, CRUD                    | ✅ Done                |
| 3     | Editor — blocks, slash commands, formatting, autosave          | ✅ Done                |
| 4     | Knowledge Graph — `[[links]]`, backlinks, graph view           | ✅ Done _(this phase)_ |
| 5     | Search — search index, `⌘K` command palette                    | ⏭️ Next                |
| 6     | Productivity — favorites, recents, tags, templates, properties | ⏳ Planned             |
| 7     | Polish — responsive pass, animation, a11y, performance         | ⏳ Planned             |

## Routes

| Route                          | Renders                                      |
| ------------------------------ | -------------------------------------------- |
| `/`                            | Redirects to `/w/default`                    |
| `/w/:workspaceId`              | Workspace root — empty state or new-page CTA |
| `/w/:workspaceId/p/:pageId`    | Full page: header, editor, backlinks         |
| `/w/:workspaceId/graph`        | Real, interactive knowledge graph            |
| `/w/:workspaceId/tags/:tagId?` | Tags (placeholder — Phase 6)                 |
| `/w/:workspaceId/templates`    | Templates (placeholder — Phase 6)            |
| `/settings/:tab?`              | Settings — Appearance is real                |

## Engineering judgment calls

A running list of decisions made along the way that deviated from the
original brief or from the obvious default, and why:

- **`src/routes/`** instead of a top-level `pages/` — the original folder
  sketch had both `features/pages/` (the Page _entity_) and a top-level
  `pages/` (routed _screens_), which collide in name and meaning
- **`react-router@8.3.0`** instead of `react-router-dom` — v8 absorbed the
  dom package into the main export, and it happens to be the version that
  clears a high-severity CVE that affected `react-router-dom` at the time
- **oxlint** instead of ESLint — Vite's own current default, faster, and its
  native `jsx-a11y` plugin covers accessibility linting without a second tool
- **Native `<dialog>`** for the mobile drawer and confirmation dialogs
  instead of `@radix-ui/react-dialog` — a real top-layer modal with a free
  focus trap and native Escape-handling, no extra dependency needed for
  something this contained
- **`@radix-ui/react-dropdown-menu` was added**, unlike the dialog above —
  correct keyboard behavior for a real menu (arrow keys, typeahead, focus
  return) is a much bigger lift to get right by hand
- **`d3-force` was added**, but not the rest of D3 or `d3-zoom` — proven
  physics matters for a graph that has to look "settled," while pan/zoom is
  simple enough to hand-roll as plain SVG transforms
- **The graph layout is computed once (300 simulation ticks), not animated
  live** — nodes visibly drifting into place on every visit reads as
  unfinished, not "alive"
- **Wikilink insertion reuses the slash-menu's own trigger-detection
  technique** (watching plain text on `onUpdate`) rather than Tiptap's
  official Suggestion/Mention extensions — one less API surface, and `[[`
  needs to trigger mid-sentence, which the simpler approach handles fine
- **A wikilink chip's label snapshots the page title at insertion time** —
  renaming the target page doesn't retroactively update chips elsewhere that
  already point to it. Documented as a known limitation, not silently accepted
- **Favorites, drag-and-drop reordering, and a workspace switcher are not
  built**, even though the general brief mentions them alongside things that
  _are_ built — the phase-by-phase roadmap places them in Phase 6, and
  building ahead of the plan wasn't the goal
- **The Graph View is honestly not very screen-reader-accessible** —
  force-directed node-link diagrams are a well-known hard case industry-wide;
  a `sr-only` note points back to the sidebar's page list rather than
  pretending an ARIA attribute solves a fundamentally spatial interface

## What's next

**Phase 5 — Search**: a real search index across page titles, content, and
(eventually) tags, plus the `⌘K` command palette that's currently just a
disabled placeholder button in the Topbar.
