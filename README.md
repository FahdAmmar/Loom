<div align="center">

# Loom

**A calm knowledge workspace — structured pages woven into a living graph of ideas.**

Notion's page structure. Obsidian's connected graph. One product, its own identity.

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
![Tests](https://img.shields.io/badge/tests-112%20passing-1e9c74?style=flat-square)
![Vulnerabilities](https://img.shields.io/badge/vulnerabilities-0-1e9c74?style=flat-square)
![Phase](https://img.shields.io/badge/phase-7%20of%207%20complete-1e9c74?style=flat-square)
![License](https://img.shields.io/badge/license-unlicensed-6c6d82?style=flat-square)

</div>

---

<div align="center">
  <img src="/public/loom.png" alt="LOOM" width="1000" />
</div>

---

## Table of contents

- [What is Loom](#what-is-loom)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Architecture &amp; design philosophy](#architecture--design-philosophy)
- [Scripts](#scripts)
- [Development roadmap](#development-roadmap)
- [Routes](#routes)
- [Engineering judgment calls](#engineering-judgment-calls)
- [Project status](#project-status)
- [License](#license)

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

## Screenshots

### Main Workspace

*[Placeholder: Screenshot of the main workspace with sidebar and editor]_

### Block Editor

*[Placeholder: Screenshot showing the block editor with slash menu open]_

### Knowledge Graph

*[Placeholder: Screenshot of the interactive graph view with nodes and edges]_

### Command Palette

*[Placeholder: Screenshot of ⌘K palette with search results and commands]_

### Mobile View

*[Placeholder: Screenshot of the responsive mobile layout with drawer]_

> **Note**: These placeholders should be replaced with actual screenshots or GIFs
> demonstrating the UI. For animated demos, consider using tools like LICEcap
> (GIF capture) or creating short videos with OBS Studio.

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
- **Favorites** — star any page from its actions menu; a dedicated sidebar
  section appears the moment you have at least one
- **Recents** — the last 8 pages you opened, tracked automatically,
  persisted across sessions, surfaced in both the sidebar and the `⌘K`
  palette's empty state
- **Drag-and-drop** — reorder pages in the tree with full keyboard support,
  including re-parenting with visual feedback

### ⭐ Tags, properties &amp; templates

- Tag any page with existing tags or create new ones inline, right from the
  page header — a type-to-filter picker, not a plain multi-select
- A dedicated Tags gallery shows every tag with its page count; click
  through to every page carrying that tag
- Add typed properties to any page — text, number, date, select, or
  checkbox — the same five types Notion-style property panels use
- Save any page as a reusable template, then start new pages from it — a
  gallery of everything you've saved, one click to use
- **8 built-in templates** shown as a visual gallery with schematic previews

### ✍️ Block editor

- 12 block types: paragraph, heading 1–3, bulleted/numbered/checklist, quote,
  callout, code, divider, toggle (with nested children), image, table,
  **and a Kanban board**
- `/` opens a filtered slash-command menu right at your cursor
- Real inline formatting — **bold**, _italic_, underline, ~~strikethrough~~,
  `inline code` — typed with familiar Markdown shortcuts (`**like this**`)
- Enter / Backspace / Arrow Up / Arrow Down all move and split blocks the way
  you'd expect from any modern block editor
- Autosave: debounced, optimistic, with a "Saving…/Saved" indicator — and a
  flush-on-navigate so a last-second edit is never silently dropped
- **Real file upload for images** — stored as data URIs (no backend yet)
- **ARIA heading semantics** — heading blocks carry `role="heading"` and
  proper `aria-level` attributes

### 🔗 Linking &amp; the knowledge graph

- Type `[[` anywhere to link to another page; the link renders as a clickable
  chip, not a raw URL
- Every page automatically shows a **Backlinks** panel — every other page
  that links to it, with one click back
- A full-screen **Graph View** with genuinely live physics — every page is a
  node, every link a directional edge, arranged by a continuous d3-force
  simulation that settles naturally and reheats the moment you drag a node,
  the way Obsidian's graph actually behaves. Pan, zoom (buttons or wheel),
  search-to-highlight, filter by tag, hover a node to see its neighborhood,
  click to open
- **Wikilinks stay in sync** — renaming a page updates all chips that link
  to it (a known limitation that got fixed)

### ⌘ Search &amp; command palette

- `⌘K` / `Ctrl+K` from anywhere opens a single, unified, keyboard-navigable
  list — no separate "search mode" vs. "command mode"
- Searches page **titles and content** — not just what's already loaded in
  the sidebar
- Doubles as a command runner: create a page, jump to the Graph, jump to
  Settings, toggle the sidebar, toggle the theme
- Typing a name that doesn't match anything offers "Create page '…'" right
  there — no need to close the palette first
- `⌘N` creates a page from anywhere; `⌘S` is safely swallowed so the
  browser's native Save dialog never interrupts typing

### 🎨 Design system &amp; theming

- Light / Dark / System, persisted, zero flash on load
- A from-scratch token system (not shadcn's defaults re-skinned) mapped onto
  Tailwind's `@theme`, so `bg-primary`, `text-muted-foreground`, `bg-brand-violet`
  etc. all just work
- Fully responsive: a collapsible desktop sidebar and a real `<dialog>`-based
  mobile drawer (native focus trap, native Escape-to-close)

### ♿ Accessibility, taken seriously rather than checked off

- Native `<dialog>` for modals and the mobile drawer, native
  `<input type="checkbox">` for checklist items, `role="listbox"`/`"option"`
  (the documented WAI-ARIA pattern) only where a native element genuinely
  can't do the job — e.g. a menu that has to render icon rows and stay
  positioned at a text cursor
- A real skip-to-content link, keyboard-reachable retry buttons on every
  error state, and every color pair in both themes checked against WCAG
  AA's 4.5:1 text-contrast threshold with the actual math, not a guess —
  five token values were quietly failing (as low as 2.97:1) and got
  corrected
- Honest limitations are _documented_, not hidden: the Graph View is a
  visual, spatial diagram with no meaningful screen-reader equivalent — so it
  says so, and points back to the sidebar's page list instead of pretending
  an ARIA role fixes it
- **Full keyboard support for drag-and-drop** — `KeyboardSensor` alongside
  pointer/touch on every drag surface

### ✨ Polish

- A comfortable, constrained reading width for the page title and editor
  body — full-width text on a wide monitor is exactly what the brief warned
  against
- Toast notifications for actions with no other visible feedback (saving a
  page as a template, for instance)
- Dialogs, the mobile drawer, and dropdown menus animate in and out with
  plain CSS — `@starting-style` for the native `<dialog>`s, `data-state`-keyed
  keyframes for Radix's dropdown — no animation library
- Page-to-page navigation uses the native View Transitions API (via React
  Router's built-in `viewTransition` option) for a soft cross-fade instead
  of an instant swap, with a clean no-op fallback where unsupported
- The Graph View gained tag filtering (deferred from Phase 4 until tags
  existed) and zoom +/− buttons — the latter closes a real gap, since
  pinch-to-zoom was never implemented and the wheel handler never fires on
  touch, so touch users previously had pan but no way to zoom at all
- Every animation and transition added this phase respects
  `prefers-reduced-motion` — checked explicitly, not assumed

### 💾 Data management

- **Workspace export/import** — download your entire workspace as JSON, or
  import a previously exported file
- **One-click reset** — "Reset to demo content" in Settings restores the
  starter workspace without needing to clear browser storage manually
- **Simulated network latency** — the mock API layer deliberately delays
  responses so loading states are honest, not cosmetic

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
| Drag and drop         | **@dnd-kit** (core, sortable, utilities)     | The active, maintained successor to react-beautiful-dnd (archived); powers the board block's cards/columns, the page tree, and block reordering             |
| Accessible primitives | **Radix UI** (Slot, Dropdown Menu)           | Correct keyboard behavior for a real menu (arrow keys, typeahead, focus return) is a much bigger lift to hand-roll than it looks                            |
| Component conventions | **shadcn/ui-style, hand-built**              | `components.json` is in place so a real `npx shadcn add` drops in cleanly the moment this environment can reach `ui.shadcn.com`                             |
| Linting               | **oxlint**                                   | Vite's own current default, far faster than ESLint, and its native `--jsx-a11y-plugin` covers accessibility linting without a second tool                   |
| Testing               | **Vitest** + Testing Library                 | Shares Vite's config and transform pipeline directly — no separate Jest/Babel setup to keep in sync                                                         |
| Formatting            | **Prettier** + `prettier-plugin-tailwindcss` | Class lists sorted automatically, zero bikeshedding                                                                                                         |

## Getting started

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm 10+** (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd loom

# Install dependencies
npm install

# Start the development server
npm run dev
# The terminal will print the local URL (typically http://localhost:5173)
