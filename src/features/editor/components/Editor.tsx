import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef } from "react";

import { BlockList } from "@/features/editor/components/BlockList";
import { BlockSelectionBar } from "@/features/editor/components/BlockSelectionBar";
import { PageOutline } from "@/features/editor/components/PageOutline";
import { EditorFocusProvider } from "@/features/editor/EditorFocusContext";
import { EditorSkeleton } from "@/features/editor/components/EditorSkeleton";
import { useEditorFocus } from "@/features/editor/useEditorFocus";
import {
  buildDragAnnouncements,
  buildDragInstructions,
} from "@/features/editor/dragAnnouncements";
import { useBlockSelectionShortcuts } from "@/features/editor/useBlockSelectionShortcuts";
import { useHistoryShortcuts } from "@/features/editor/useHistoryShortcuts";
import { usePageLayout } from "@/hooks/usePageLayout";
import { useT } from "@/i18n/useT";
import { getOrderedBlocks } from "@/lib/blocks";
import { useBlockSelectionStore } from "@/stores/useBlockSelectionStore";
import { editorHistory, useEditorStore } from "@/stores/useEditorStore";

function EditorBody({ pageId }: { pageId: string }) {
  const isLoading = useEditorStore((s) => s.isLoading);
  const loadedPageId = useEditorStore((s) => s.loadedPageId);
  const blocksById = useEditorStore((s) => s.blocksById);
  const createBlock = useEditorStore((s) => s.createBlock);
  const reorderBlock = useEditorStore((s) => s.reorderBlock);
  const { widthClass, fontClass, sizeClass } = usePageLayout(pageId);
  const { focus } = useEditorFocus();
  useHistoryShortcuts();
  useBlockSelectionShortcuts(pageId);
  const t = useT();
  // Read blocks at announce time, so the position reflects the move in progress.
  const dragAccessibility = useMemo(
    () => ({
      announcements: buildDragAnnouncements(() => useEditorStore.getState().blocksById, t),
      screenReaderInstructions: buildDragInstructions(t),
    }),
    [t],
  );

  // A selection belongs to one page: drop it when leaving.
  useEffect(() => () => useBlockSelectionStore.getState().clear(), [pageId]);

  const seededPageIdRef = useRef<string | null>(null);
  const topLevelBlocks = getOrderedBlocks(blocksById, pageId, null);

  // Pointer: 8px of movement before a drag starts, so clicking into a block
  // to edit text doesn't get mistaken for the start of a drag gesture.
  // Keyboard: Tab to a grip handle, Space/Enter to pick up, arrow keys to
  // move, Space/Enter to drop, Escape to cancel — dnd-kit's standard
  // pattern, not something this app builds itself.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reordering is scoped to siblings — a block only ever reorders among
    // the other blocks sharing its own parentBlockId (top-level blocks
    // among themselves, a toggle's children among themselves). Both ids
    // come from the store directly since drag-and-drop never crosses scopes.
    const draggedBlock = blocksById[String(active.id)];
    if (!draggedBlock) return;
    const siblings = getOrderedBlocks(blocksById, pageId, draggedBlock.parentBlockId);
    const newIndex = siblings.findIndex((b) => b.id === over.id);
    if (newIndex === -1) return;

    void reorderBlock(draggedBlock.id, newIndex);
  }

  // A brand-new page has nothing to click into — seed one empty paragraph
  // so there's always somewhere to start typing. Guarded on loadedPageId,
  // not just isLoading: on first mount isLoading briefly reads "false" from
  // the store's initial state, before this page's load has even started —
  // without the loadedPageId check that looks identical to "confirmed
  // empty" and seeds a spurious block into a page that already has content.
  useEffect(() => {
    if (
      isLoading ||
      loadedPageId !== pageId ||
      topLevelBlocks.length > 0 ||
      seededPageIdRef.current === pageId
    ) {
      return;
    }
    seededPageIdRef.current = pageId;
    createBlock({ pageId, type: "paragraph", content: { html: "" }, parentBlockId: null }).then(
      (created) => {
        // The starter block isn't a user edit: undoing it would leave nowhere to type.
        editorHistory.clear();
        requestAnimationFrame(() => focus(created.id));
      },
    );
    // createBlock/focus are stable (Zustand action / context value) — only
    // isLoading, loadedPageId, the block count, and the page itself should
    // retrigger this.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadedPageId, topLevelBlocks.length, pageId]);

  if (isLoading) return <EditorSkeleton />;

  return (
    <div className={`mx-auto px-6 py-6 ${widthClass} ${fontClass} ${sizeClass}`}>
      <PageOutline pageId={pageId} />
      <BlockSelectionBar />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={dragAccessibility}
      >
        <BlockList pageId={pageId} />
      </DndContext>
      <button
        type="button"
        onClick={() => focus(topLevelBlocks.at(-1)?.id)}
        aria-label="Click to continue writing"
        className="h-16 w-full cursor-text print:hidden"
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
