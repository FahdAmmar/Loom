import { useRef, useState, type ChangeEvent } from "react";
import { Download, Loader2, Monitor, Moon, RotateCcw, Sun, Upload } from "lucide-react";

import * as backupApi from "@/api/backup";
import type { WorkspaceExport } from "@/api/backup";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import type { ThemePreference } from "@/stores/useSettingsStore";

const WORKSPACE_ID = "default";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Filesystem-safe stand-in for a workspace name in a download filename. */
function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "workspace"
  );
}

export function SettingsRoute() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setExporting] = useState(false);
  const [isImporting, setImporting] = useState(false);
  const [isResetting, setResetting] = useState(false);
  const [pendingImport, setPendingImport] = useState<WorkspaceExport | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await backupApi.exportWorkspace(WORKSPACE_ID);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `loom-${slugify(data.workspace.name)}-${data.exportedAt.slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast("Workspace exported", "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't export the workspace.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again after a cancelled import
    if (!file) return;
    try {
      const text = await file.text();
      setPendingImport(backupApi.parseWorkspaceExport(text));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't read that file.", "error");
    }
  }

  async function handleConfirmImport() {
    if (!pendingImport) return;
    setImporting(true);
    try {
      await backupApi.importWorkspace(pendingImport, WORKSPACE_ID);
      // Every store's cached state was built from data this import just
      // replaced — a full reload is the simplest way to guarantee the
      // whole app (sidebar, graph, editor, ...) reflects it correctly.
      window.location.assign(`/w/${WORKSPACE_ID}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't import that file.", "error");
      setImporting(false);
      setPendingImport(null);
    }
  }

  async function handleConfirmReset() {
    setResetting(true);
    try {
      await backupApi.resetWorkspaceToDemoContent();
      window.location.assign(`/w/${WORKSPACE_ID}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Couldn't reset the workspace.", "error");
      setResetting(false);
      setConfirmingReset(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Account and workspace preferences land here as later phases add them. Appearance is
        wired up now.
      </p>

      <section className="mt-8">
        <h2 className="text-foreground text-sm font-medium">Appearance</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose how Loom looks. "System" follows your OS setting automatically.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-sm">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              aria-pressed={theme === value}
              variant={theme === value ? "default" : "outline"}
              className="h-auto flex-col gap-1.5 py-4"
              onClick={() => setTheme(value)}
            >
              <Icon className="size-4" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section className="border-border mt-8 border-t pt-8">
        <h2 className="text-foreground text-sm font-medium">Import & export</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Back up this workspace to a file, or restore it from one exported earlier.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Export workspace
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="size-3.5" />
            Import workspace
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          Workspace looking empty or stuck from testing import? Reset it back to the built-in
          demo content.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-2"
          onClick={() => setConfirmingReset(true)}
        >
          <RotateCcw className="size-3.5" />
          Reset to demo content
        </Button>
      </section>

      <ConfirmDialog
        open={pendingImport !== null}
        title="Replace this workspace?"
        description={`This replaces every page in this workspace with the ${pendingImport?.pages.length ?? 0} page${pendingImport?.pages.length === 1 ? "" : "s"} from "${pendingImport?.workspace.name}". This can't be undone.`}
        confirmLabel={isImporting ? "Importing…" : "Import"}
        variant="destructive"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmingReset}
        title="Reset to demo content?"
        description="This replaces every page in this workspace with the built-in sample pages, tags, and templates. This can't be undone."
        confirmLabel={isResetting ? "Resetting…" : "Reset"}
        variant="destructive"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmingReset(false)}
      />
    </div>
  );
}
