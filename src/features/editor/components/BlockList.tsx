import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { memo, useMemo } from "react";

import { BlockRow } from "@/features/editor/components/BlockRow";
import { ListItemView } from "@/features/editor/components/ListItemView";
import { useBlockEditingHandlers } from "@/features/editor/useBlockEditingHandlers";
import { getOrderedBlocks, groupIntoRuns } from "@/lib/blocks";
import { useEditorStore } from "@/stores/useEditorStore";
import type { Block } from "@/types/entities";

interface ListRunItemProps {
  block: Block;
  pageId: string;
  previousBlockId: string | null;
  nextBlockId: string | null;
  numberInList?: number;
}

/** One <li> — a real component so useBlockEditingHandlers is called at the top level, not inside a .map(). */
const ListRunItem = memo(function ListRunItem({
  block,
  pageId,
  previousBlockId,
  nextBlockId,
  numberInList,
}: ListRunItemProps) {
  const updateBlockContent = useEditorStore((s) => s.updateBlockContent);
  const { handlers } = useBlockEditingHandlers(block, pageId, previousBlockId, nextBlockId);
  const sortable = useSortable({ id: block.id, data: { type: "block" } });

  return (
    <ListItemView
      key={`${block.id}-${block.type}`}
      block={block as Block & { content: { html?: string; checked?: boolean } }}
      numberInList={numberInList}
      sortable={sortable}
      onToggleChecked={() =>
        updateBlockContent(block.id, { ...block.content, checked: !block.content.checked })
      }
      onChange={(html) => updateBlockContent(block.id, { ...block.content, html })}
      {...handlers}
    />
  );
});

interface BlockListProps {
  pageId: string;
  parentBlockId?: string | null;
}

export function BlockList({ pageId, parentBlockId = null }: BlockListProps) {
  const blocksById = useEditorStore((s) => s.blocksById);

  // getOrderedBlocks/groupIntoRuns re-scan the whole map on every keystroke
  // (blocksById changes on every edit) — memoizing means a re-render caused
  // by something other than this page's blocks changing doesn't redo the work.
  const { blocks, runs } = useMemo(() => {
    const orderedBlocks = getOrderedBlocks(blocksById, pageId, parentBlockId);
    return { blocks: orderedBlocks, runs: groupIntoRuns(orderedBlocks) };
  }, [blocksById, pageId, parentBlockId]);

  return (
    <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-0.5">
        {runs.map((run) => {
          if (run.kind === "single") {
            const index = blocks.findIndex((b) => b.id === run.block.id);
            return (
              <BlockRow
                key={run.block.id}
                block={run.block}
                pageId={pageId}
                previousBlockId={blocks[index - 1]?.id ?? null}
                nextBlockId={blocks[index + 1]?.id ?? null}
              />
            );
          }

          const ListTag = run.type === "numberedList" ? "ol" : "ul";
          const runKey = run.blocks[0].id;
          return (
            <ListTag key={runKey} className="flex flex-col gap-0.5 pl-0.5">
              {run.blocks.map((block, itemIndex) => {
                const index = blocks.findIndex((b) => b.id === block.id);
                return (
                  <ListRunItem
                    key={block.id}
                    block={block}
                    pageId={pageId}
                    previousBlockId={blocks[index - 1]?.id ?? null}
                    nextBlockId={blocks[index + 1]?.id ?? null}
                    numberInList={itemIndex + 1}
                  />
                );
              })}
            </ListTag>
          );
        })}
      </div>
    </SortableContext>
  );
}
