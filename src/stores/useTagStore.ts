import { create } from "zustand";

import * as tagsApi from "@/api/tags";
import type { Tag } from "@/types/entities";

interface TagState {
  tagsById: Record<string, Tag>;
  isLoading: boolean;

  loadTags: (workspaceId: string) => Promise<void>;
  createTag: (workspaceId: string, name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set) => ({
  tagsById: {},
  isLoading: false,

  loadTags: async (workspaceId) => {
    set({ isLoading: true });
    const tags = await tagsApi.listTags(workspaceId);
    set({ tagsById: Object.fromEntries(tags.map((t) => [t.id, t])), isLoading: false });
  },

  createTag: async (workspaceId, name) => {
    const tag = await tagsApi.createTag(workspaceId, name);
    set((s) => ({ tagsById: { ...s.tagsById, [tag.id]: tag } }));
    return tag;
  },

  deleteTag: async (id) => {
    await tagsApi.deleteTag(id);
    set((s) => {
      const next = { ...s.tagsById };
      delete next[id];
      return { tagsById: next };
    });
  },
}));
