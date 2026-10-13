# Loom

A calm knowledge workspace: page hierarchy + a force-directed graph, client-side only (React 19, TypeScript strict, Vite, Tailwind v4, Zustand, Tiptap, d3-force, react-router). No real backend — `src/api/` is a mock REST layer over `localStorage`/IndexedDB, written with the exact async shape a real API would have.

<!-- Personal notes go in CLAUDE.local.md (gitignored), not here. -->

Documentation index: `docs/README.md`. Skills the project needs: `docs/skills.md`. Release notes: `docs/CHANGELOG.md`.

## Commands

- `npm run dev` — start Vite dev server
- `npm run typecheck` — `tsc -b --noEmit`, must be zero errors
- `npm run lint` — oxlint, must be zero errors/warnings
- `npm run test` — Vitest, run once (`test:watch` for watch mode)
- `npm run build` — `tsc -b && vite build`, must complete cleanly
- `npm run format` / `format:check` — Prettier (writes are auto-run by a hook on every file edit)

## The four verification gates (non-negotiable)

Before calling any change done: **typecheck → lint → test → build**, in that order, all passing. Run `/verify` to execute all four. Never report a task finished on the strength of the code "looking right" — run the gates.

## Architecture — read before adding code

- **`src/api/` is the only layer allowed to touch persistence.** Nothing else reads or writes `localStorage`/IndexedDB directly. Functions are `async` and shaped like a real REST call even though they hit a local mock (`api/_mockDb.ts`, `api/idbStorage.ts`) with a simulated network delay — the day a real backend exists, only these files change.
- **Derived data is never stored twice.** The page tree, backlinks, and the graph layout are all _computed_ from flat state (`lib/tree.ts`, filtering `Link` records, a live layout simulation) — never cached as a second copy. If you're about to add a field that duplicates something derivable, don't.
- **State is split by who needs it.** Zustand stores (`src/stores/`, one `use<Name>Store.ts` per concern). Purely local, single-component UI state (a zoom level, a query string) stays in `useState`, not a store.
- **Feature-first structure.** Each `src/features/<name>/` owns its components and a `README.md` describing what's real vs. a placeholder. Put new UI in the feature it belongs to, not in `src/components/`, which is for things shared across features.
- **`src/lib/` is pure functions only** — no React, no store access. Test these first, before wiring up UI.

Full detail: `.claude/rules/architecture.md` and `.claude/rules/api-conventions.md`.

## Code style

- TypeScript strict mode. No `any` without a comment explaining why.
- Named exports for components, not `export default`. Props interface named `<Component>Props`.
- Import via the `@/` alias (`@/lib/tree`), not relative `../../` chains.
- Prettier owns formatting (double quotes, semicolons, trailing commas, 96-col, Tailwind class sorting) — don't hand-format, let the hook do it.
- Comments explain _why_, not _what_. See `.claude/rules/code-style.md` for the full rundown.

## Testing

Vitest + Testing Library, `jsdom` environment. Co-locate tests next to the file they cover (`tree.ts` → `tree.test.ts`). Use `src/test/fixtures.ts` for test data instead of inlining objects. See `.claude/rules/testing.md`.

## Available commands

`/review` (code review against these rules), `/verify` (the four gates), `/fix-issue [description]`, `/new-feature [name]` (scaffold a `src/features/` module). Each is defined in `.claude/skills/`.
