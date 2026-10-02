# Phases 5-6 — Focus mode + Print/PDF (changed files only)

Copy over the same paths. Apply AFTER Phases 1-4. No dependency changes.

## Focus mode
- ⌘⇧F / Ctrl+Shift+F, a button in the top bar, or "Toggle focus mode" in the command palette hides the top bar and sidebar.
- A quiet "Exit focus" button stays at the top corner (dimmed, full opacity on hover/focus). Session-only: not persisted.

## Print / Save as PDF
- Page menu -> "Print / Save as PDF" (browser's ⌘P works too).
- The page flows across paper instead of being clipped to the screen; blocks avoid splitting across pages.
- App chrome (top bar, sidebar, block handles, undo/redo, outline, backlinks, save status, toasts) is hidden.
- Dark theme is switched to light while printing (beforeprint/afterprint) so text stays readable, then restored.

## Known limitations
- Not tried in a real browser or a real print preview (jsdom has no layout/print). Check: long pages, tables, images, dark mode.
- Escape does not exit focus mode (avoids clashing with the slash menu and dialogs); use ⌘⇧F or the button.
- Pages print without a header/footer of their own; the browser adds its own.
