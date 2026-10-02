import { ChevronDown, ListTree } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { findBlockElement, useActiveHeading } from "@/features/editor/useActiveHeading";
import { useT } from "@/i18n/useT";
import { getOutline } from "@/lib/outline";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/useEditorStore";

const MIN_HEADINGS = 2;
const INDENT_PX = 12;

function scrollToBlock(blockId: string) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  findBlockElement(blockId)?.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function PageOutline({ pageId }: { pageId: string }) {
  const blocksById = useEditorStore((s) => s.blocksById);
  const collapsedToggleIds = useEditorStore((s) => s.collapsedToggleIds);
  const [isOpen, setOpen] = useState(true);
  const listId = useId();
  const t = useT();

  const items = useMemo(
    () => getOutline(blocksById, pageId, collapsedToggleIds),
    [blocksById, pageId, collapsedToggleIds],
  );
  const activeId = useActiveHeading(items.map((item) => item.blockId));

  if (items.length < MIN_HEADINGS) return null;
  const topLevel = Math.min(...items.map((item) => item.level));

  return (
    <nav
      aria-label={t("outline.title")}
      className="border-border bg-card/40 mb-6 rounded-lg border print:hidden"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setOpen((open) => !open)}
        className="text-muted-foreground hover:text-foreground flex min-h-10 w-full items-center gap-2 px-3 text-sm font-medium"
      >
        <ListTree className="size-4 shrink-0" />
        <span className="flex-1 text-start">{t("outline.title")}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <ol id={listId} className="flex flex-col gap-0.5 px-2 pb-2">
          {items.map((item) => {
            const isActive = item.blockId === activeId;
            return (
              <li key={item.blockId}>
                <button
                  type="button"
                  aria-current={isActive ? "location" : undefined}
                  onClick={() => scrollToBlock(item.blockId)}
                  style={{ paddingInlineStart: 8 + (item.level - topLevel) * INDENT_PX }}
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground w-full truncate rounded-md border-s-2 py-1.5 pe-2 text-start text-sm transition-colors",
                    isActive
                      ? "border-primary text-foreground font-medium"
                      : "text-muted-foreground border-transparent",
                  )}
                >
                  {item.text}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
