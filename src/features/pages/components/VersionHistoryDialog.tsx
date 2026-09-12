import { useEffect, useState } from "react";
import { History, RotateCcw, Save } from "lucide-react";

import * as pageVersionsApi from "@/api/pageVersions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useEditorStore } from "@/stores/useEditorStore";
import type { PageVersion } from "@/types/entities";

interface VersionHistoryDialogProps {
  pageId: string;
  open: boolean;
  onClose: () => void;
}

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function VersionHistoryDialog({ pageId, open, onClose }: VersionHistoryDialogProps) {
  const { toast } = useToast();
  const loadBlocks = useEditorStore((s) => s.loadBlocks);
  const [versions, setVersions] = useState<PageVersion[] | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmingRestore, setConfirmingRestore] = useState<PageVersion | null>(null);

  useEffect(() => {
    if (!open) return;
    setVersions(null);
    pageVersionsApi.listVersions(pageId).then(setVersions);
  }, [open, pageId]);

  async function handleSaveVersion() {
    setSaving(true);
    try {
      const version = await pageVersionsApi.saveVersion(pageId);
      setVersions((current) => [version, ...(current ?? [])]);
      toast("Saved a version of this page.", "success");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmRestore() {
    const version = confirmingRestore;
    if (!version) return;
    setConfirmingRestore(null);
    setRestoringId(version.id);
    try {
      await pageVersionsApi.restoreVersion(version.id);
      await loadBlocks(pageId);
      const refreshed = await pageVersionsApi.listVersions(pageId);
      setVersions(refreshed);
      toast("Restored that version. The state just before is saved too.", "success");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        aria-label="Version history"
        className="max-h-[80vh]"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <History className="size-4" />
            Version history
          </h2>
          <Button size="sm" variant="outline" onClick={handleSaveVersion} disabled={isSaving}>
            <Save className="size-3.5" />
            Save a version
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {versions === null ? (
            <div className="text-muted-foreground px-2 py-6 text-center text-sm">Loading…</div>
          ) : versions.length === 0 ? (
            <div className="text-muted-foreground px-2 py-6 text-center text-sm">
              No saved versions yet. Save one to create a checkpoint you can come back to.
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {versions.map((version) => (
                <li
                  key={version.id}
                  className="hover:bg-accent flex items-center justify-between gap-3 rounded-md px-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm">
                      {new Intl.DateTimeFormat(undefined, TIME_FORMAT).format(
                        new Date(version.createdAt),
                      )}
                    </p>
                    {version.label && (
                      <p className="text-text-faint truncate text-xs">{version.label}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={restoringId === version.id}
                    onClick={() => setConfirmingRestore(version)}
                  >
                    <RotateCcw className="size-3.5" />
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmingRestore !== null}
        title="Restore this version?"
        description="This replaces the page's current content. The state just before restoring is saved automatically, so this is never a dead end."
        confirmLabel="Restore"
        onConfirm={handleConfirmRestore}
        onCancel={() => setConfirmingRestore(null)}
      />
    </>
  );
}
