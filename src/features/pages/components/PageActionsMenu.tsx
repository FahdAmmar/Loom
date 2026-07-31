import { useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDescendantIds } from "@/lib/tree";
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
  const createPage = usePageStore((s) => s.createPage);
  const deletePage = usePageStore((s) => s.deletePage);
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);

  const descendantCount = getDescendantIds(pagesById, pageId).length;

  async function handleAddSubpage() {
    const child = await createPage(WORKSPACE_ID, pageId);
    navigate(`/w/${WORKSPACE_ID}/p/${child.id}`);
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
    await deletePage(pageId);
    onDeleted?.();
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
          <DropdownMenuItem onSelect={handleAddSubpage}>
            <Plus className="size-3.5" />
            Add subpage
          </DropdownMenuItem>
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
