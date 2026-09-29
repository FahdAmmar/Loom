---
paths:
  - "src/api/**/*.ts"
---

# API conventions

`src/api/` is the only layer allowed to touch persistence directly. No component, hook, or store should call `localStorage` or IndexedDB itself — it goes through a function here.

- Every exported function is `async`, even though it's backed by a local mock — this is what lets the mock be swapped for a real API later without touching any caller.
- Route through `api/_mockDb.ts` (localStorage-backed) or `api/idbStorage.ts` (IndexedDB-backed), not raw browser storage calls, so the simulated network delay (`networkDelay()`) and seed-data behavior stay consistent across modules.
- Match the existing per-domain module shape: one file per entity (`pages.ts`, `blocks.ts`, `links.ts`, `tags.ts`, `templates.ts`, `workspaces.ts`, `pageProperties.ts`, `pageVersions.ts`, `dailyNotes.ts`, `search.ts`, `backup.ts`). A new entity gets a new file in this list, not a grab-bag added to an existing one.
- `api/client.ts` holds the centralized Axios instance and interceptors — for anything that will eventually be a real HTTP call, go through it rather than instantiating a new client.
- Errors: throw `ApiError` (from `api/client.ts`) with a status code, don't return a sentinel/null for a failure a caller must check — e.g. `throw new ApiError(\`No page found with id "${id}".\`, 404)`. Callers (usually a Zustand store action) catch it and translate into the store's `error` field.
- Tests for this layer mock `networkDelay` to resolve instantly (already global via `src/test/setup.ts`) and assert on the shape of the returned/thrown value, not on `localStorage` internals.
