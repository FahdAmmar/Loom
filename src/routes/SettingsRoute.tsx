import { useRef, useState, type ChangeEvent } from "react";
import {
  AlignHorizontalJustifyCenter,
  Compass,
  Download,
  Smartphone,
  Keyboard,
  Loader2,
  Monitor,
  Moon,
  PilcrowLeft,
  PilcrowRight,
  RotateCcw,
  Sun,
  Upload,
} from "lucide-react";

import * as backupApi from "@/api/backup";
import type { WorkspaceExport } from "@/api/backup";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useTheme } from "@/hooks/useTheme";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";
import { useToast } from "@/hooks/useToast";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { useShortcutsDialogStore } from "@/stores/useShortcutsDialogStore";
import {
  useSettingsStore,
  type EditorWidth,
  type UiDirection,
  type ThemePreference,
} from "@/stores/useSettingsStore";

const WORKSPACE_ID = "default";

const THEME_OPTIONS: { value: ThemePreference; label: MessageKey; icon: typeof Sun }[] = [
  { value: "light", label: "theme.light", icon: Sun },
  { value: "dark", label: "theme.dark", icon: Moon },
  { value: "system", label: "theme.system", icon: Monitor },
];

const EDITOR_WIDTH_OPTIONS: {
  value: EditorWidth;
  label: MessageKey;
  description: MessageKey;
}[] = [
  { value: "narrow", label: "width.narrow", description: "width.narrowHelp" },
  { value: "wide", label: "width.wide", description: "width.wideHelp" },
];

// Language names stay in their own script so they're findable whatever the current language is.
const LANGUAGE_OPTIONS: { value: UiDirection; label: string; icon: typeof PilcrowLeft }[] = [
  { value: "ltr", label: "English", icon: PilcrowRight },
  { value: "rtl", label: "العربية", icon: PilcrowLeft },
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
  const t = useT();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const editorWidth = useSettingsStore((s) => s.editorWidth);
  const setEditorWidth = useSettingsStore((s) => s.setEditorWidth);
  const direction = useSettingsStore((s) => s.direction);
  const setDirection = useSettingsStore((s) => s.setDirection);
  const openShortcuts = useShortcutsDialogStore((s) => s.open);
  const openTour = useOnboardingStore((s) => s.open);
  const { canInstall, install } = useInstallPrompt();
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
      toast(t("settings.exported"), "success");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : t("settings.exportFailed"), "error");
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
      toast(err instanceof ApiError ? err.message : t("settings.readFailed"), "error");
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
      toast(err instanceof ApiError ? err.message : t("settings.importFailed"), "error");
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
      toast(err instanceof ApiError ? err.message : t("settings.resetFailed"), "error");
      setResetting(false);
      setConfirmingReset(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-xl font-semibold">{t("nav.settings")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("settings.intro")}</p>

      <section className="mt-8">
        <h2 className="text-foreground text-sm font-medium">{t("settings.appearance")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("settings.appearanceHelp")}</p>
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
              {t(label)}
            </Button>
          ))}
        </div>
      </section>

      <section className="border-border mt-8 border-t pt-8">
        <h2 className="text-foreground text-sm font-medium">{t("settings.language")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("settings.languageHelp")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
          {LANGUAGE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              aria-pressed={direction === value}
              variant={direction === value ? "default" : "outline"}
              className="h-auto gap-1.5 py-3"
              onClick={() => setDirection(value)}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section className="border-border mt-8 border-t pt-8">
        <h2 className="text-foreground text-sm font-medium">{t("settings.editor")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("settings.editorHelp")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
          {EDITOR_WIDTH_OPTIONS.map(({ value, label, description }) => (
            <Button
              key={value}
              type="button"
              aria-pressed={editorWidth === value}
              variant={editorWidth === value ? "default" : "outline"}
              className="h-auto flex-col items-start gap-0.5 py-3 text-start"
              onClick={() => setEditorWidth(value)}
            >
              <span className="flex items-center gap-1.5">
                <AlignHorizontalJustifyCenter className="size-3.5" />
                {t(label)}
              </span>
              <span className="text-xs font-normal opacity-80">{t(description)}</span>
            </Button>
          ))}
        </div>

        <p className="text-muted-foreground mt-6 text-sm">{t("settings.shortcutsHelp")}</p>
        <Button type="button" variant="outline" className="mt-2" onClick={openShortcuts}>
          <Keyboard className="size-3.5" />
          {t("shortcuts.title")}
        </Button>

        <p className="text-muted-foreground mt-6 text-sm">{t("tour.replayHelp")}</p>
        <Button type="button" variant="outline" className="mt-2" onClick={openTour}>
          <Compass className="size-3.5" />
          {t("tour.replay")}
        </Button>

        {canInstall && (
          <>
            <p className="text-muted-foreground mt-6 text-sm">{t("install.help")}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={() => void install()}
            >
              <Smartphone className="size-3.5" />
              {t("install.title")}
            </Button>
          </>
        )}
      </section>

      <section className="border-border mt-8 border-t pt-8">
        <h2 className="text-foreground text-sm font-medium">{t("settings.importExport")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("settings.importExportHelp")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {t("settings.export")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="size-3.5" />
            {t("settings.import")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
        <p className="text-muted-foreground mt-4 text-sm">{t("settings.resetHelp")}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-2"
          onClick={() => setConfirmingReset(true)}
        >
          <RotateCcw className="size-3.5" />
          {t("settings.reset")}
        </Button>
      </section>

      <ConfirmDialog
        open={pendingImport !== null}
        title={t("settings.replaceTitle")}
        description={t("settings.replaceDesc", {
          name: pendingImport?.workspace.name ?? "",
          count: pendingImport?.pages.length ?? 0,
        })}
        confirmLabel={isImporting ? t("settings.importing") : t("settings.importConfirm")}
        variant="destructive"
        onConfirm={handleConfirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={confirmingReset}
        title={t("settings.resetTitle")}
        description={t("settings.resetDesc")}
        confirmLabel={isResetting ? t("settings.resetting") : t("settings.resetConfirm")}
        variant="destructive"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmingReset(false)}
      />
    </div>
  );
}
