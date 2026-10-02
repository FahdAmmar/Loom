import { useEffect } from "react";
import { Outlet } from "react-router";

import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { ToastProvider } from "@/components/ui/toast";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { TourDialog } from "@/features/onboarding/TourDialog";
import { CommandPalette } from "@/features/search/components/CommandPalette";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { usePrintLightTheme } from "@/hooks/usePrintLightTheme";
import { useFocusModeStore } from "@/stores/useFocusModeStore";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { usePageStore } from "@/stores/usePageStore";
import { useShortcutsDialogStore } from "@/stores/useShortcutsDialogStore";
import { useTagStore } from "@/stores/useTagStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

import { FocusModeExit } from "./FocusModeExit";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const WORKSPACE_ID = "default";

export function AppShell() {
  const loadWorkspace = useWorkspaceStore((s) => s.loadWorkspace);
  const loadPages = usePageStore((s) => s.loadPages);
  const loadTags = useTagStore((s) => s.loadTags);
  const isShortcutsOpen = useShortcutsDialogStore((s) => s.isOpen);
  const closeShortcuts = useShortcutsDialogStore((s) => s.close);
  const isFocused = useFocusModeStore((s) => s.isFocused);
  useGlobalShortcuts();
  usePrintLightTheme();

  // A first visit gets the welcome tour once; after that it's opt-in (Settings / palette).
  useEffect(() => {
    const { hasSeenTour, open } = useOnboardingStore.getState();
    if (!hasSeenTour) open();
  }, []);

  useEffect(() => {
    loadWorkspace(WORKSPACE_ID);
    loadPages(WORKSPACE_ID);
    loadTags(WORKSPACE_ID);
    // Zustand actions are referentially stable, so it's safe to omit them
    // here — this effect is meant to run exactly once, on mount.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToastProvider>
      <div className="flex h-dvh flex-col print:block print:h-auto">
        <a
          href="#main-content"
          className="bg-background text-foreground focus-visible:outline-ring sr-only rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        {isFocused ? <FocusModeExit /> : <Topbar />}
        <div className="flex min-h-0 flex-1 print:block">
          {!isFocused && <Sidebar />}
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 overflow-y-auto print:overflow-visible"
          >
            <Outlet />
          </main>
        </div>
        <CommandPalette />
        <TourDialog />
        <UpdatePrompt />
        <ShortcutsDialog open={isShortcutsOpen} onClose={closeShortcuts} />
      </div>
    </ToastProvider>
  );
}
