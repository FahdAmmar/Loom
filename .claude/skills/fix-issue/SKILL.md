---
name: fix-issue
description: Fix a bug in Loom, following the project's architecture, and verify the fix.
disable-model-invocation: true
argument-hint: [bug description or issue reference]
---

Fix this issue in Loom: $ARGUMENTS

1. Reproduce it: find the affected code under `src/features/`, `src/api/`, `src/lib/`, or `src/stores/` — check `.claude/rules/architecture.md` if it's unclear which layer owns the behavior.
2. Find the root cause before changing anything. Don't patch a symptom.
3. Write the smallest correct fix. Don't touch files the bug doesn't require touching.
4. Add a regression test next to the changed file (`*.test.ts`) that fails before the fix and passes after.
5. Run `/verify` (typecheck, lint, test, build) before reporting the fix as done.
