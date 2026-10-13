import { useRef, useState, type ChangeEvent } from "react";
import { FileArchive, FileText, Loader2 } from "lucide-react";

import * as backupApi from "@/api/backup";
import { ApiError } from "@/api/client";
import { importMarkdownFiles } from "@/api/markdownImport";
import { Button } from "@/components/ui/button";
import { workspaceToMarkdownZip } from "@/features/markdown/exportZip";
import { useToast } from "@/hooks/useToast";
import { useT } from "@/i18n/useT";
import { downloadBlob, slugify } from "@/lib/downloadFile";
import { usePageStore } from "@/stores/usePageStore";

const WORKSPACE_ID = "default";

export function MarkdownTransfer() {
  const t = useT();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isZipping, setZipping] = useState(false);
  const [isImporting, setImporting] = useState(false);

  async function handleZip() {
    setZipping(true);
    try {
      const data = await backupApi.exportWorkspace(WORKSPACE_ID);
      const zip = workspaceToMarkdownZip(data);
      const name = `loom-${slugify(data.workspace.name)}-${data.exportedAt.slice(0, 10)}.zip`;
      downloadBlob(name, new Blob([zip as BlobPart], { type: "application/zip" }));
      toast(t("transfer.zipDone"), "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("transfer.zipFailed"), "error");
    } finally {
      setZipping(false);
    }
  }

  async function handleFilesSelected(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;
    setImporting(true);
    try {
      const files = await Promise.all(
        selected.map(async (file) => ({ name: file.name, text: await file.text() })),
      );
      const result = await importMarkdownFiles(files, WORKSPACE_ID);
      await usePageStore.getState().loadPages(WORKSPACE_ID);
      toast(
        t("transfer.importDone", {
          imported: result.imported,
          placeholders: result.placeholders,
        }),
        "success",
      );
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("transfer.importFailed"), "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="border-border mt-8 border-t pt-8">
      <h2 className="text-foreground text-sm font-medium">{t("transfer.title")}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{t("transfer.help")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleZip} disabled={isZipping}>
          {isZipping ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileArchive className="size-3.5" />
          )}
          {t("transfer.zip")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileText className="size-3.5" />
          )}
          {t("transfer.import")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          aria-label={t("transfer.import")}
          tabIndex={-1}
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>
    </section>
  );
}
