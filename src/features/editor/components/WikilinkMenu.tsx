import { FileText } from "lucide-react";

import type { Page } from "@/types/entities";

interface WikilinkMenuProps {
  pages: Page[];
  activeIndex: number;
  coords: { x: number; y: number };
  onSelect: (page: Page) => void;
  onHoverIndex: (index: number) => void;
}

export function WikilinkMenu({
  pages,
  activeIndex,
  coords,
  onSelect,
  onHoverIndex,
}: WikilinkMenuProps) {
  return (
    <div
      // A native <select> can't render icon+label rows, can't be positioned
      // at the text cursor, and can't stay open while filtering as you type —
      // role="listbox" is the documented WAI-ARIA pattern for exactly this.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="listbox"
      aria-label="Link to a page"
      className="border-border bg-popover text-popover-foreground fixed z-50 max-h-72 w-64 overflow-y-auto rounded-md border p-1 shadow-md"
      style={{ left: coords.x, top: coords.y + 6 }}
    >
      {pages.length === 0 ? (
        <p className="text-muted-foreground px-2 py-1.5 text-sm">No matching page.</p>
      ) : (
        pages.map((page, index) => (
          <button
            key={page.id}
            type="button"
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => onHoverIndex(index)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(page);
            }}
            className={
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm " +
              (index === activeIndex
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground")
            }
          >
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">{page.title}</span>
          </button>
        ))
      )}
    </div>
  );
}
