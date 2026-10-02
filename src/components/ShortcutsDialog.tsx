import { Dialog } from "@/components/ui/dialog";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";

interface Shortcut {
  keys: string[];
  description: MessageKey;
}

interface ShortcutGroup {
  title: MessageKey;
  shortcuts: Shortcut[];
}

// Every entry here was checked against the actual code, not assumed:
// global ones against useGlobalShortcuts.ts, block navigation against
// useBlockEditingHandlers.ts, and formatting marks against the installed
// @tiptap/extension-* packages' own addKeyboardShortcuts() — Loom doesn't
// define those, Tiptap's defaults do.
const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "shortcuts.global",
    shortcuts: [
      { keys: ["⌘", "K"], description: "shortcuts.search" },
      { keys: ["⌘", "N"], description: "shortcuts.newPage" },
      { keys: ["⌘", "⇧", "F"], description: "shortcuts.focus" },
    ],
  },
  {
    title: "shortcuts.blocks",
    shortcuts: [
      { keys: ["/"], description: "shortcuts.insertBlock" },
      { keys: ["[", "["], description: "shortcuts.linkPage" },
      { keys: ["Enter"], description: "shortcuts.newBlock" },
      { keys: ["Shift", "Enter"], description: "shortcuts.lineBreak" },
      { keys: ["Backspace"], description: "shortcuts.deleteEmpty" },
      { keys: ["↑", "↓"], description: "shortcuts.moveBetween" },
    ],
  },
  {
    title: "shortcuts.formatting",
    shortcuts: [
      { keys: ["⌘", "B"], description: "shortcuts.bold" },
      { keys: ["⌘", "I"], description: "shortcuts.italic" },
      { keys: ["⌘", "U"], description: "shortcuts.underline" },
      { keys: ["⌘", "⇧", "S"], description: "shortcuts.strike" },
      { keys: ["⌘", "E"], description: "shortcuts.code" },
      { keys: ["⌘", "Z"], description: "shortcuts.undo" },
      { keys: ["⌘", "⇧", "Z"], description: "history.redo" },
    ],
  },
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  return (
    <Dialog open={open} onClose={onClose} aria-label={t("shortcuts.title")} className="p-0">
      <div className="border-border border-b px-4 py-3">
        <h2 className="text-sm font-medium">{t("shortcuts.title")}</h2>
      </div>

      <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-4">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-text-faint mb-2 text-xs font-medium tracking-wide uppercase">
              {t(group.title)}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {group.shortcuts.map((shortcut) => (
                <li
                  key={shortcut.description}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{t(shortcut.description)}</span>
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
