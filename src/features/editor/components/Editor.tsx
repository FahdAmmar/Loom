import { useEffect, useRef } from "react";

import { BlockList } from "@/features/editor/components/BlockList";
import { EditorFocusProvider } from "@/features/editor/EditorFocusContext";
import { EditorSkeleton } from "@/features/editor/components/EditorSkeleton";
import { useEditorFocus } from "@/features/editor/useEditorFocus";
import { getOrderedBlocks } from "@/lib/blocks";
import { useEditorStore } from "@/stores/useEditorStore";

function EditorBody({ pageId }: { pageId: string }) {
  const isLoading = useEditorStore((s) => s.isLoading);
  const blocksById = useEditorStore((s) => s.blocksById);
  const createBlock = useEditorStore((s) => s.createBlock);
  const { focus } = useEditorFocus();

  const seededPageIdRef = useRef<string | null>(null);
  const topLevelBlocks = getOrderedBlocks(blocksById, pageId, null);

  // A brand-new page has nothing to click into — seed one empty paragraph
  // so there's always somewhere to start typing.
  useEffect(() => {
    if (isLoading || topLevelBlocks.length > 0 || seededPageIdRef.current === pageId) return;
    seededPageIdRef.current = pageId;
    createBlock({ pageId, type: "paragraph", content: { html: "" }, parentBlockId: null }).then(
      (created) => requestAnimationFrame(() => focus(created.id)),
    );
    // createBlock/focus are stable (Zustand action / context value) — only
    // isLoading, the block count, and the page itself should retrigger this.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, topLevelBlocks.length, pageId]);

  if (isLoading) return <EditorSkeleton />;

  return (
    <div className="px-6 py-6">
      <BlockList pageId={pageId} />
      <button
        type="button"
        onClick={() => focus(topLevelBlocks.at(-1)?.id)}
        aria-label="Click to continue writing"
        className="h-16 w-full cursor-text"
      />
    </div>
  );
}

export function Editor({ pageId }: { pageId: string }) {
  const loadBlocks = useEditorStore((s) => s.loadBlocks);
  const clear = useEditorStore((s) => s.clear);

  useEffect(() => {
    loadBlocks(pageId);
    return () => clear();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  return (
    <EditorFocusProvider>
      <EditorBody pageId={pageId} />
    </EditorFocusProvider>
  );
}
