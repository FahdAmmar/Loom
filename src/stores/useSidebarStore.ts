import { create } from "zustand";

interface SidebarState {
  /** Desktop: sidebar collapsed to icon rail. */
  isCollapsed: boolean;
  /** Mobile: sidebar rendered as an off-canvas drawer. */
  isMobileOpen: boolean;
  /** Which page-tree nodes are expanded, keyed by page id. Absent = expanded (default open). */
  collapsedPageIds: Record<string, boolean>;
  toggleCollapsed: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  togglePageExpanded: (pageId: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  collapsedPageIds: {},
  toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
  openMobile: () => set({ isMobileOpen: true }),
  closeMobile: () => set({ isMobileOpen: false }),
  togglePageExpanded: (pageId) =>
    set((s) => ({
      collapsedPageIds: { ...s.collapsedPageIds, [pageId]: !s.collapsedPageIds[pageId] },
    })),
}));
