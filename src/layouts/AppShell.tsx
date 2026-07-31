import { useEffect } from "react";
import { Outlet } from "react-router";

import { usePageStore } from "@/stores/usePageStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const WORKSPACE_ID = "default";

export function AppShell() {
  const loadWorkspace = useWorkspaceStore((s) => s.loadWorkspace);
  const loadPages = usePageStore((s) => s.loadPages);

  useEffect(() => {
    loadWorkspace(WORKSPACE_ID);
    loadPages(WORKSPACE_ID);
    // Zustand actions are referentially stable, so it's safe to omit them
    // here — this effect is meant to run exactly once, on mount.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
