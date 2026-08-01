import { Megaphone } from "lucide-react";

import { BlockTextEditor } from "@/features/editor/components/BlockTextEditor";
import type { BlockEditingHandlers } from "@/features/editor/types";
import type { Block, BlockType } from "@/types/entities";

const VARIANT_CLASSNAMES: Partial<Record<BlockType, string>> = {
  heading1: "text-2xl font-bold",
  heading2: "text-xl font-semibold",
  heading3: "text-lg font-semibold",
  quote: "italic text-muted-foreground",
  paragraph: "",
  callout: "",
};

const PLACEHOLDERS: Partial<Record<BlockType, string>> = {
  paragraph: "Type '/' for commands, or just start writing…",
  heading1: "Heading 1",
  heading2: "Heading 2",
  heading3: "Heading 3",
  quote: "Quote",
  callout: "Take note…",
};

interface TextBlockViewProps extends BlockEditingHandlers {
  block: Block & { content: { html?: string } };
}

export function TextBlockView({ block, ...handlers }: TextBlockViewProps) {
  const editorEl = (
    <BlockTextEditor
      blockId={block.id}
      html={typeof block.content.html === "string" ? block.content.html : ""}
      placeholder={PLACEHOLDERS[block.type]}
      className={VARIANT_CLASSNAMES[block.type]}
      {...handlers}
    />
  );

  if (block.type === "quote") {
    return <div className="border-border border-l-2 py-0.5 pl-3">{editorEl}</div>;
  }

  if (block.type === "callout") {
    return (
      <div className="bg-muted flex items-start gap-2.5 rounded-md px-3 py-2.5">
        <Megaphone className="text-brand-gold mt-0.5 size-4 shrink-0" />
        {editorEl}
      </div>
    );
  }

  return editorEl;
}
