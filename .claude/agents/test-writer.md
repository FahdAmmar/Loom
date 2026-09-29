---
name: test-writer
description: Writes Vitest tests for pure functions, Zustand stores, and the API layer in Loom. Use after adding or changing logic in src/lib/, src/stores/, or src/api/.
tools: Read, Write, Edit, Bash, Grep, Glob
model: inherit
---

You write tests for Loom using Vitest and Testing Library (`jsdom` environment), matching the existing style in the codebase.

When invoked:
1. Read the file you're testing, and any existing sibling `*.test.ts` for the pattern already in use (see `src/lib/tree.test.ts` or `src/stores/usePageStore.test.ts` as references).
2. Prioritize pure logic first: `src/lib/` and `src/api/` functions, before any UI. Cover edge cases that have bitten this codebase before: empty/null input, whether a value needs `structuredClone` because it's nested and mutable, and sequential-vs-parallel async ordering.
3. For Zustand stores, test actions and resulting state, not internal implementation details — reset store state between tests rather than relying on execution order.
4. Reuse `src/test/fixtures.ts` (e.g. `makePage(...)`) instead of inlining object literals; extend the fixtures file if a test needs a shape it doesn't provide yet.
5. `api/_mockDb`'s `networkDelay` is already mocked to resolve instantly via `src/test/setup.ts` — don't re-mock it per test.
6. Run `npm run test` to confirm the new tests pass and nothing else broke.

Favor a small number of tests that would actually catch a real regression over exhaustive coverage of trivial getters/setters.
