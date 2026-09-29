import { Dialog } from "@/components/ui/dialog";

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

// Every entry here was checked against the actual code, not assumed:
// global ones against useGlobalShortcuts.ts, block navigation against
// useBlockEditingHandlers.ts, and formatting marks against the installed
// @tiptap/extension-* packages' own addKeyboardShortcuts() — Loom doesn't
// define those, Tiptap's defaults do.
const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open search & commands" },
      { keys: ["⌘", "N"], description: "Create a new page" },
    ],
  },
  {
    title: "Blocks",
    shortcuts: [
      { keys: ["/"], description: "Insert a block" },
      { keys: ["[", "["], description: "Link to a page (or type @)" },
      { keys: ["Enter"], description: "New block below" },
      { keys: ["Shift", "Enter"], description: "Line break within a block" },
      { keys: ["Backspace"], description: "Delete an empty block, merge into the one above" },
      { keys: ["↑", "↓"], description: "Move to the previous or next block" },
    ],
  },
  {
    title: "Text formatting",
    shortcuts: [
      { keys: ["⌘", "B"], description: "Bold" },
      { keys: ["⌘", "I"], description: "Italic" },
      { keys: ["⌘", "U"], description: "Underline" },
      { keys: ["⌘", "⇧", "S"], description: "Strikethrough" },
      { keys: ["⌘", "E"], description: "Inline code" },
      { keys: ["⌘", "Z"], description: "Undo (within the current block)" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo (within the current block)" },
    ],
  },
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} aria-label="Keyboard shortcuts" className="p-0">
      <div className="border-border border-b px-4 py-3">
        <h2 className="text-sm font-medium">Keyboard shortcuts</h2>
      </div>

      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-4">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-text-faint mb-2 text-xs font-medium tracking-wide uppercase">
              {group.title}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {group.shortcuts.map((shortcut) => (
                <li
                  key={shortcut.description}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{shortcut.description}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {/* SHORTCUT_GROUPS is a static constant, never reordered
                        or filtered, so an index key can't cause the stale
                        state this rule normally guards against. */}
                    {shortcut.keys.map((key, i) => (
                      <kbd
                        // oxlint-disable-next-line react/no-array-index-key
                        key={i}
                        className="border-border text-text-faint rounded border px-1.5 py-0.5 font-mono text-[10px]"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
