---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
---

# Testing

Vitest + Testing Library, `jsdom` environment (`vite.config.ts` → `test.environment`). `src/test/setup.ts` mocks `api/_mockDb`'s `networkDelay` to resolve instantly, so tests don't wait out the simulated network latency — leave that mock alone, it's global.

- **Co-locate**: a test file lives next to what it tests (`src/lib/tree.ts` → `src/lib/tree.test.ts`), not in a separate `__tests__/` tree.
- **Test order**: pure functions in `src/lib/` and `src/api/` first — they're the cheapest to test and where most real bugs get caught (null-pinning in sorts, `structuredClone` requirements on nested data, sequential-vs-parallel async ordering have all surfaced here before). UI tests come after the logic underneath them is solid.
- **Fixtures**: use `src/test/fixtures.ts` (e.g. `makePage(...)`) instead of inlining object literals — extend the fixture file if a test needs a shape it doesn't yet provide.
- **Style**: `describe`/`it` from `vitest`, one behavior per `it`, and a comment on a test only when the *reason* for a tricky case isn't obvious from its description (see `tree.test.ts` for the pattern).
- **Zustand stores**: test the store's actions and resulting state, not internal implementation — reset store state between tests rather than sharing state across `it` blocks.
- Every new bug fix gets a regression test in the same PR/turn as the fix, added *before* you consider the fix done.
