---
name: new-feature
description: Scaffold a new feature module under src/features/ following Loom's feature-first structure.
disable-model-invocation: true
argument-hint: [feature-name]
---

Scaffold a new feature named `$ARGUMENTS` under `src/features/$ARGUMENTS/`, following the pattern of the existing features in that directory:

1. Create `src/features/$ARGUMENTS/` with a `components/` subfolder and a `README.md` stating what the feature does, what's implemented, and what's a deliberate placeholder.
2. Shared or cross-component state goes in a new `use<Name>Store.ts` under `src/stores/` (see `.claude/rules/architecture.md`) — not local component state, unless it's genuinely single-component and ephemeral.
3. Persistence goes through a new or existing module under `src/api/`, never `localStorage`/IndexedDB directly from a component or store (see `.claude/rules/api-conventions.md`).
4. If the feature is user-navigable, add a route file under `src/routes/` and register it in `src/App.tsx`.
5. Write tests for any new pure logic (`*.test.ts`) before wiring up the UI.
