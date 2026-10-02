import { useState } from "react";
import { Copy, MoreHorizontal, Plus, Printer, Star, StarOff, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as templatesApi from "@/api/templates";
import { getDescendantIds } from "@/lib/tree";
import { useToast } from "@/hooks/useToast";
import { usePageStore } from "@/stores/usePageStore";

const WORKSPACE_ID = "default";

interface PageActionsMenuProps {
  pageId: string;
  pageTitle: string;
  triggerClassName?: string;
  /** Called after a successful delete — e.g. to navigate away from a page that no longer exists. */
  onDeleted?: () => void;
}

export function PageActionsMenu({
  pageId,
  pageTitle,
  triggerClassName,
  onDeleted,
}: PageActionsMenuProps) {
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const isFavorite = usePageStore((s) => Boolean(s.pagesById[pageId]?.isFavorite));
  const createPage = usePageStore((s) => s.createPage);
  const duplicatePage = usePageStore((s) => s.duplicatePage);
  const deletePage = usePageStore((s) => s.deletePage);
  const undoDeletePage = usePageStore((s) => s.undoDeletePage);
  const toggleFavorite = usePageStore((s) => s.toggleFavorite);
  const { toast } = useToast();
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);

  const descendantCount = getDescendantIds(pagesById, pageId).length;

  async function handleAddSubpage() {
    const child = await createPage(WORKSPACE_ID, pageId);
    navigate(`/w/${WORKSPACE_ID}/p/${child.id}`, { viewTransition: true });
  }

  async function handleSaveAsTemplate() {
    await templatesApi.createTemplateFromPage(pageId, WORKSPACE_ID, pageTitle);
    toast(`Saved "${pageTitle}" as a template`, "success");
  }

  function handlePrint() {
    // Wait a frame so the closing menu is gone before the browser snapshots the page.
    requestAnimationFrame(() => window.print());
  }

  async function handleDuplicate() {
    const copy = await duplicatePage(pageId);
    navigate(`/w/${WORKSPACE_ID}/p/${copy.id}`, { viewTransition: true });
  }

  function handleDeleteSelect() {
    // Radix returns focus to the menu trigger when it closes; opening the
    // dialog in the very same tick fights that focus-return. Deferring one
    // tick lets the menu finish closing first — the standard workaround for
    // "open a dialog from a menu item."
    setTimeout(() => setConfirmingDelete(true), 0);
  }

  async function handleConfirmDelete() {
    setConfirmingDelete(false);
    const snapshot = await deletePage(pageId);
    onDeleted?.();
    toast(`Deleted "${pageTitle}"`, "default", {
      label: "Undo",
      onClick: () => undoDeletePage(snapshot),
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={triggerClassName}
            aria-label={`More actions for ${pageTitle}`}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => toggleFavorite(pageId)}>
            {isFavorite ? <StarOff className="size-3.5" /> : <Star className="size-3.5" />}
            {isFavorite ? "Remove from favorites" : "Add to favorites"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleAddSubpage}>
            <Plus className="size-3.5" />
            Add subpage
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSaveAsTemplate}>
            <Plus className="size-3.5" />
            Save as template
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDuplicate}>
            <Copy className="size-3.5" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handlePrint}>
            <Printer className="size-3.5" />
            Print / Save as PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleDeleteSelect}>
            <Trash2 className="size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={isConfirmingDelete}
        title={`Delete "${pageTitle}"?`}
        description={
          descendantCount > 0
            ? `This also deletes ${descendantCount} sub-page${descendantCount === 1 ? "" : "s"} beneath it. This can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
