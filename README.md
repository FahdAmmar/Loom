# Loom

A calm knowledge workspace — structured pages woven into a living graph of ideas.

This is **Phase 2 — Workspace** of the 7-phase roadmap. Real pages now exist:
create, nest, navigate, rename, delete. The block editor body is still a
placeholder — that's Phase 3.

## Stack

Vite 8 · React 19 · TypeScript · Tailwind CSS v4 · Zustand · Axios ·
React Router v8 · Radix UI (Slot, Dropdown Menu) · hand-built shadcn/ui-style
primitives (Button, Dialog, Dropdown Menu, Confirm Dialog)

## Getting started

```bash
npm install
npm run dev       # start the dev server
```

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

**From Phase 1:** theme system (light/dark/system, persisted, no flash),
responsive `AppShell` (desktop rail + `<dialog>`-based mobile drawer),
centralized Axios client, full route table.

**New in Phase 2:**

- Real pages, backed by a localStorage-mocked data layer (`api/pages.ts`,
  `api/workspaces.ts`) behind the same async function shape a real backend
  call would have — swapping in a real API later is an internal change only
- Page tree in the sidebar: nested, expand/collapse (state lives in
  `useSidebarStore`, not local component state), a starter "Welcome to Loom"
  page tree seeded on first run so nesting is visible immediately
- Create / delete (cascading, with a confirmation dialog that tells you how
  many sub-pages come with it) / rename (inline, in the page header) /
  navigate — all wired through `usePageStore`
- Breadcrumbs, computed live from the page tree, not stored
- Loading skeleton for the tree, "page doesn't exist" state for stale/deleted
  URLs (distinct from the generic 404)

## A note on scope: what Phase 2 deliberately does _not_ include

The plan's general Page System section lists reordering, moving, and
favoriting alongside creating/editing/deleting/nesting — but the Phase 2
roadmap bullet list only calls out **Sidebar, Workspace, Page tree, Nested
pages, Page creation, Page deletion, Page navigation**. Favorites and Recents
are explicitly Phase 6 ("Productivity") in the roadmap, so:

- No favoriting UI yet (the `Page.isFavorite` field exists in the type, unused)
- No drag-and-drop reordering yet
- No workspace switcher (still a single hardcoded `default` workspace)

These are staying out on purpose rather than getting built ahead of their
phase.

## Routes

| Route                          | Renders                                |
| ------------------------------ | -------------------------------------- |
| `/`                            | Redirects to `/w/default`              |
| `/w/:workspaceId`              | **Real** — empty state or new-page CTA |
| `/w/:workspaceId/p/:pageId`    | **Real header**, placeholder body      |
| `/w/:workspaceId/graph`        | Graph View (placeholder)               |
| `/w/:workspaceId/tags/:tagId?` | Tags (placeholder)                     |
| `/w/:workspaceId/templates`    | Templates (placeholder)                |
| `/settings/:tab?`              | Settings — Appearance is real          |

## Judgment calls worth flagging

- **Native `<dialog>` over `@radix-ui/react-dialog`** for the confirmation
  dialog — the mobile drawer already proved the pattern (real focus trap,
  native ESC) in Phase 1, and a plain confirm/cancel box doesn't need
  Radix's full composability. A richer modal (e.g. a "create page" form)
  would be the point where pulling in Radix's Dialog becomes worth it.
- **`@radix-ui/react-dropdown-menu` was added**, unlike the confirm dialog —
  correct keyboard behavior (arrow keys, typeahead, focus return) for a real
  menu is a much bigger lift to hand-roll correctly, and this is exactly
  what Radix (and shadcn/ui) exists to solve.
- **Opening the delete confirmation from a dropdown item is deferred by one
  tick** (`setTimeout(..., 0)`) — opening a dialog directly inside a
  `DropdownMenuItem`'s `onSelect` is a documented Radix gotcha: the menu's
  own close-and-return-focus logic fights the dialog's own focus trap if
  both happen in the same tick.
- Carried over from Phase 1: `src/routes/` instead of a top-level `pages/`
  (naming collision with `features/pages/`), `react-router@8.3.0` instead of
  `react-router-dom` (CVE), oxlint instead of ESLint.

## Next up

**Phase 3 — Editor**: blocks, slash commands, formatting, autosave — the
part of a page that's currently just an empty-state placeholder.
