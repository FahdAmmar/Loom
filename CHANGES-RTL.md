# Phase 1 — RTL / Arabic support (changed files only)

Copy these files over the same paths in your project. No dependency changes.

- Settings → "Language & direction": mirrors the whole UI (`<html dir>` + `lang`), persisted, applied before first paint (index.html).
- Physical Tailwind classes (left/right/ml/pr/border-l/text-left) → logical (start/end/ms/pe/border-s/text-start).
- `dir="auto"` on editor blocks, page title, board/table/database inputs, palette search; code blocks stay `dir="ltr"`.
- Direction-aware: table column resize (drag + arrow keys), mobile drawer slide, Radix dropdown menus, chevrons (rtl:-scale-x-100).

## Known limitations
- No Arabic web font added (system fallback only) — needs a package.json change, e.g. an @fontsource package.
- Graph View canvas, slash/wikilink popup placement at the caret, and the quote block's border side follow the UI direction, not the block's own text direction.
- Not verified visually in a browser: this snapshot can't build (missing `marked`, `vite-plugin-pwa`). Verified: zero new typecheck errors vs the 71 baseline, lint 0/0, +4 passing tests, no new failures.
