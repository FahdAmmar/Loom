import { useEffect } from "react";
import { Outlet } from "react-router";

import { ToastProvider } from "@/components/ui/toast";
import { CommandPalette } from "@/features/search/components/CommandPalette";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { usePageStore } from "@/stores/usePageStore";
import { useTagStore } from "@/stores/useTagStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const WORKSPACE_ID = "default";

export function AppShell() {
  const loadWorkspace = useWorkspaceStore((s) => s.loadWorkspace);
  const loadPages = usePageStore((s) => s.loadPages);
  const loadTags = useTagStore((s) => s.loadTags);
  useGlobalShortcuts();

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
      <div className="flex h-dvh flex-col">
        <a
          href="#main-content"
          className="bg-background text-foreground focus-visible:outline-ring sr-only rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        <Topbar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
      </div>
    </ToastProvider>
  );
}
