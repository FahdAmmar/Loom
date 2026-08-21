import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router";

import { PageTreeItem } from "@/features/pages/components/PageTreeItem";
import { PageTreeSkeleton } from "@/features/pages/components/PageTreeSkeleton";
import { buildPageTree, flattenVisibleTree, getDescendantIds } from "@/lib/tree";
import { usePageStore } from "@/stores/usePageStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import type { DragEndEvent } from "@dnd-kit/core";

const WORKSPACE_ID = "default";

export function PageTree({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const isLoading = usePageStore((s) => s.isLoading);
  const error = usePageStore((s) => s.error);
  const createPage = usePageStore((s) => s.createPage);
  const loadPages = usePageStore((s) => s.loadPages);
  const movePage = usePageStore((s) => s.movePage);
  const collapsedPageIds = useSidebarStore((s) => s.collapsedPageIds);

  const tree = useMemo(() => buildPageTree(pagesById), [pagesById]);
  const flat = useMemo(
    () => flattenVisibleTree(tree, collapsedPageIds),
    [tree, collapsedPageIds],
  );

  // Pointer: 8px of movement before a drag starts, so a plain click to
  // navigate or to open the "..." menu doesn't get mistaken for a drag
  // gesture. Keyboard: Tab to a grip handle, Space/Enter to pick up, arrow
  // keys to reorder among siblings, Space/Enter to drop. Note: the
  // top/middle/bottom drop-zone split below (reorder vs. nest) is driven by
  // pixel position, which a keyboard drag doesn't produce the same way — a
  // keyboard-only user can reorder a page among its current siblings, but
  // re-parenting it (nesting under a different page) still needs a pointer.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleNewPage() {
    const page = await createPage(WORKSPACE_ID, null);
    navigate(`/w/${WORKSPACE_ID}/p/${page.id}`, { viewTransition: true });
    onNavigate?.();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    const draggedPage = pagesById[draggedId];
    const overPage = pagesById[overId];
    if (!draggedPage || !overPage) return;

    // Never allow dropping a page inside its own subtree — the API rejects
    // this too, but checking here avoids a flash of the (about to be
    // reverted) optimistic position.
    if (getDescendantIds(pagesById, draggedId).includes(overId)) return;

    // A keyboard-driven drag snaps the active item to align with whatever
    // it's being compared against — its rect ends up sitting almost
    // exactly on top of the target's, rather than sweeping continuously
    // through it the way a pointer drag does. Reusing the pointer-only
    // pixel-position zone below against that snapped rect would land in
    // the "nest" zone on nearly every keyboard move, since the two rects
    // are already centered on each other before any zone math even runs —
    // so a keyboard drag always reorders as a sibling instead; nesting via
    // keyboard isn't supported by this simpler tree yet.
    const isKeyboardDrag = event.activatorEvent instanceof KeyboardEvent;

    let newParentId: string | null;
    let newIndex: number;

    if (!isKeyboardDrag) {
      // Where within the target row the pointer currently sits decides the
      // gesture: the top/bottom quarter of the row reorders as a sibling
      // before/after it; the middle half nests it as a new child of the row
      // instead — the two gestures a page tree is normally expected to
      // support in one drag, disambiguated by drop position within the row
      // rather than needing a separate "make child" control.
      const activeRect = active.rect.current.translated;
      const overRect = over.rect;
      const relativeY =
        activeRect && overRect
          ? (activeRect.top + activeRect.height / 2 - overRect.top) / overRect.height
          : 0.5;

      if (relativeY > 0.25 && relativeY < 0.75) {
        newParentId = overPage.id;
        newIndex = flat.filter(
          (r) => r.page.parentId === overPage.id && r.page.id !== draggedId,
        ).length;
        void movePage(draggedId, newParentId, newIndex);
        return;
      }

      newParentId = overPage.parentId;
      const siblings = flat.filter(
        (r) => r.page.parentId === newParentId && r.page.id !== draggedId,
      );
      const overIndex = siblings.findIndex((r) => r.page.id === overId);
      newIndex = relativeY <= 0.25 ? overIndex : overIndex + 1;
      void movePage(draggedId, newParentId, newIndex);
      return;
    }

    newParentId = overPage.parentId;
    const keyboardSiblings = flat.filter(
      (r) => r.page.parentId === newParentId && r.page.id !== draggedId,
    );
    newIndex = keyboardSiblings.findIndex((r) => r.page.id === overId);
    void movePage(draggedId, newParentId, newIndex);
  }

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between px-3">
        <span className="text-text-faint text-xs font-medium tracking-wide uppercase">
          Workspace
        </span>
        <button
          type="button"
          onClick={handleNewPage}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-6 items-center justify-center rounded"
          aria-label="New page"
          title="New page"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {isLoading ? (
        <PageTreeSkeleton />
      ) : error ? (
        <div className="flex flex-col items-start gap-1 px-3 py-1">
          <p className="text-destructive text-sm">{error}</p>
          <button
            type="button"
            onClick={() => loadPages(WORKSPACE_ID)}
            className="text-primary text-xs font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      ) : flat.length === 0 ? (
        <p className="text-text-faint px-3 py-1 text-sm">No pages yet.</p>
      ) : (
        <div className="px-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={flat.map((r) => r.page.id)}
              strategy={verticalListSortingStrategy}
            >
              {flat.map((row) => (
                <PageTreeItem
                  key={row.page.id}
                  page={row.page}
                  depth={row.depth}
                  hasChildren={row.hasChildren}
                  onNavigate={onNavigate}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
