import { create } from "zustand";

import * as workspacesApi from "@/api/workspaces";
import type { Workspace } from "@/types/entities";

interface WorkspaceState {
  workspacesById: Record<string, Workspace>;
  activeWorkspaceId: Workspace["id"] | null;
  loadWorkspace: (id: string) => Promise<void>;
  setActiveWorkspace: (id: Workspace["id"]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspacesById: {},
  activeWorkspaceId: null,

  loadWorkspace: async (id) => {
    const workspace = await workspacesApi.getWorkspace(id);
    set((s) => ({
      workspacesById: { ...s.workspacesById, [workspace.id]: workspace },
      activeWorkspaceId: workspace.id,
    }));
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
}));
