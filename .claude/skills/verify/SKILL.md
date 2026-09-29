---
name: verify
description: Run Loom's four required verification gates before considering any change complete.
disable-model-invocation: true
allowed-tools: Bash(npm run typecheck) Bash(npm run lint) Bash(npm run test) Bash(npm run build)
---

Run these four gates in order and stop at the first failure — don't run a later gate on top of a failing earlier one:

1. `npm run typecheck` — must be zero TypeScript errors
2. `npm run lint` — oxlint, must be zero errors and zero warnings
3. `npm run test` — Vitest, all tests passing
4. `npm run build` — production build must complete cleanly

If a gate fails, fix it, then re-run that gate (and only that one) before moving to the next. Report which gates passed. Don't tell the user a change is done until all four pass.
