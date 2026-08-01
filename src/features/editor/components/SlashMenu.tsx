import type { SlashCommandDef } from "@/features/editor/constants";

interface SlashMenuProps {
  commands: SlashCommandDef[];
  activeIndex: number;
  coords: { x: number; y: number };
  onSelect: (command: SlashCommandDef) => void;
  onHoverIndex: (index: number) => void;
}

export function SlashMenu({
  commands,
  activeIndex,
  coords,
  onSelect,
  onHoverIndex,
}: SlashMenuProps) {
  return (
    // A native <select> can't render icon+label rows, can't be positioned at
    // the text cursor, and can't stay open while the user keeps typing a
    // filter query elsewhere — role="listbox" is the documented WAI-ARIA
    // pattern for exactly this kind of custom command menu.
    <div
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="listbox"
      aria-label="Block type"
      className="border-border bg-popover text-popover-foreground fixed z-50 max-h-72 w-56 overflow-y-auto rounded-md border p-1 shadow-md"
      style={{ left: coords.x, top: coords.y + 6 }}
    >
      {commands.length === 0 ? (
        <p className="text-muted-foreground px-2 py-1.5 text-sm">No matching block type.</p>
      ) : (
        commands.map((command, index) => {
          const Icon = command.icon;
          return (
            <button
              key={command.type}
              type="button"
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => onHoverIndex(index)}
              // mousedown (not click) fires before the editor's blur/selection change
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(command);
              }}
              className={
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm " +
                (index === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground")
              }
            >
              <Icon className="size-3.5 shrink-0" />
              {command.label}
            </button>
          );
        })
      )}
    </div>
  );
}
