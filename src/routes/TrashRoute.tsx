import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

import * as pagesApi from "@/api/pages";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/hooks/useToast";
import { usePageStore } from "@/stores/usePageStore";
import type { Page } from "@/types/entities";

const WORKSPACE_ID = "default";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

export function TrashRoute() {
  const { toast } = useToast();
  const restorePage = usePageStore((s) => s.restorePage);
  const [trashedPages, setTrashedPages] = useState<Page[] | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);

  function reload() {
    pagesApi.listTrashedPages(WORKSPACE_ID).then(setTrashedPages);
  }

  useEffect(reload, []);

  async function handleRestore(page: Page) {
    await restorePage(page.id);
    setTrashedPages((prev) => prev?.filter((p) => p.id !== page.id) ?? null);
    toast(`Restored "${page.title || "Untitled"}"`, "success");
  }

  async function handlePermanentlyDelete() {
    const id = confirmingDeleteId;
    setConfirmingDeleteId(null);
    if (!id) return;
    await pagesApi.permanentlyDeletePage(id);
    setTrashedPages((prev) => prev?.filter((p) => p.id !== id) ?? null);
    toast("Deleted for good.", "success");
  }

  async function handleEmptyTrash() {
    setConfirmingEmpty(false);
    await pagesApi.emptyTrash(WORKSPACE_ID);
    setTrashedPages([]);
    toast("Trash emptied.", "success");
  }

  if (trashedPages === null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10" aria-hidden="true">
        <title>Trash · Loom</title>
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-muted h-12 animate-pulse rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (trashedPages.length === 0) {
    return (
      <>
        <title>Trash · Loom</title>
        <EmptyState
          icon={<Trash2 className="size-5" />}
          title="Trash is empty"
          description="Pages you delete land here for 30 days before being removed for good, so a delete is never a dead end."
        />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <title>Trash · Loom</title>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Trash</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Removed for good after 30 days. Restore a page any time before then.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setConfirmingEmpty(true)}>
          Empty Trash
        </Button>
      </div>

      <ul className="mt-6 flex flex-col gap-1">
        {trashedPages.map((page) => (
          <li
            key={page.id}
            className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">
                {page.title || "Untitled"}
              </p>
              {page.deletedAt && (
                <p className="text-text-faint text-xs">
                  Deleted{" "}
                  {new Intl.DateTimeFormat(undefined, DATE_FORMAT).format(
                    new Date(page.deletedAt),
                  )}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleRestore(page)}>
                <RotateCcw className="size-3.5" />
                Restore
              </Button>
              <button
                type="button"
                onClick={() => setConfirmingDeleteId(page.id)}
                aria-label={`Delete "${page.title || "Untitled"}" forever`}
                title="Delete forever"
                className="text-muted-foreground hover:text-destructive flex size-8 items-center justify-center rounded-md"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmingDeleteId !== null}
        title="Delete this page forever?"
        description="This also removes every sub-page beneath it. There's no more Trash to catch it after this."
        confirmLabel="Delete forever"
        variant="destructive"
        onConfirm={handlePermanentlyDelete}
        onCancel={() => setConfirmingDeleteId(null)}
      />

      <ConfirmDialog
        open={confirmingEmpty}
        title="Empty Trash?"
        description={`This permanently deletes all ${trashedPages.length} item${trashedPages.length === 1 ? "" : "s"} in Trash. There's no undo after this.`}
        confirmLabel="Empty Trash"
        variant="destructive"
        onConfirm={handleEmptyTrash}
        onCancel={() => setConfirmingEmpty(false)}
      />
    </div>
  );
}
