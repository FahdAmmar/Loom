import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { BlockTextEditor } from "@/features/editor/components/BlockTextEditor";
import type { BlockEditingHandlers } from "@/features/editor/types";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/entities";

interface ToggleBlockViewProps extends BlockEditingHandlers {
  block: Block & { content: { html?: string } };
  isExpanded: boolean;
  onToggleExpand: () => void;
  hasChildren: boolean;
  onAddChild: () => void;
  childrenSlot: ReactNode;
}

export function ToggleBlockView({
  block,
  isExpanded,
  onToggleExpand,
  hasChildren,
  onAddChild,
  childrenSlot,
  ...handlers
}: ToggleBlockViewProps) {
  return (
    <div>
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? "Collapse" : "Expand"}
          aria-expanded={isExpanded}
          className="text-text-faint mt-1 flex size-5 shrink-0 items-center justify-center"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform rtl:-scale-x-100",
              isExpanded && "rotate-90",
            )}
          />
        </button>
        <BlockTextEditor
          blockId={block.id}
          html={typeof block.content.html === "string" ? block.content.html : ""}
          placeholder="Toggle"
          className="font-medium"
          {...handlers}
        />
      </div>

      {isExpanded && (
        <div className="border-border ms-6 mt-1 border-s ps-3">
          {childrenSlot}
          {!hasChildren && (
            <button
              type="button"
              onClick={onAddChild}
              className="text-text-faint hover:text-foreground py-1 text-sm"
            >
              + Add content inside
            </button>
          )}
        </div>
      )}
    </div>
  );
}
