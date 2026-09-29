# Architecture

## Derived data is never stored twice

This is the rule that shows up most across the codebase, and the one to check first when something looks like it might duplicate state:

- The page **tree** isn't stored nested — `lib/tree.ts` computes it from the flat `pagesById` map on every render.
- **Backlinks** aren't their own table — they're `Link` records filtered by `targetPageId` in `api/links.ts`.
- The **Graph View**'s nodes and edges are pages and links, laid out live by a simulation — not stored themselves.

If a change is about to add a field that could instead be computed from data that already exists, compute it instead.

## State is split by who needs it

Seven Zustand stores (`src/stores/`) — `useSettingsStore`, `useSidebarStore`, `useWorkspaceStore`, `usePageStore`, `useEditorStore`, `useSearchStore`, `useTagStore` — each own one concern, so a component reading only the theme doesn't re-render when unrelated state changes elsewhere. Purely local, single-component, ephemeral state (a graph's current zoom, a command palette's in-progress query) stays in `useState`. If you're unsure whether new state belongs in a store: does anything outside this one component need to read it, or does it need to survive the component unmounting? If not, `useState`.

## Feature-first structure

`src/features/<name>/` owns its components and a `README.md` saying what's implemented, what's a deliberate placeholder, and what got reconsidered mid-build. Put new feature UI there, not in `src/components/` — that folder is for things genuinely shared across more than one feature (e.g. `EmptyState`).

## Persistence goes through `src/api/` only

See `.claude/rules/api-conventions.md`.

## No real backend, on purpose

Every layer is written as if a real backend existed. `api/pages.ts`, `api/blocks.ts`, `api/links.ts`, etc. expose plain `async` functions shaped like a real REST call, backed by a small JSON "database" in `localStorage` (`api/_mockDb.ts`) with a simulated network delay so loading states get exercised honestly. When a real backend exists, only those `api/*.ts` files should need to change — nothing else in the app should know the difference. Don't special-case the mock elsewhere in the app to "skip" the delay or the async shape.
