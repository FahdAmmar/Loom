# Phase 4 — Page outline / table of contents (changed files only)

Copy over the same paths. Apply AFTER Phases 1-3. No dependency changes.

- "On this page" panel above the editor when a page has 2+ headings (H1-H3, including inside expanded toggles). Collapsible, keyboard accessible, RTL-safe.
- Click scrolls smoothly (instant when the user prefers reduced motion); the current section is highlighted (bold + border, not colour alone) via IntersectionObserver.
- Derived from blocks on every render, nothing stored. Headings inside collapsed toggles are omitted.
- BlockRow gets `data-block-id` and `scroll-mt-20` so headings can be found and land below the top bar.

## Known limitations
- Inline panel, not a floating side rail: a fixed rail needs a layout pass I couldn't verify without a browser.
- Not checked visually or with real scrolling (jsdom has no layout); the active-section logic is untested beyond its guards.
