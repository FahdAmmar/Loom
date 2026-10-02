import { EDITOR_WIDTH_CLASSES, useSettingsStore } from "@/stores/useSettingsStore";
import { getPageLayoutClasses, type PageLayoutClasses } from "@/lib/pageLayout";
import { usePageViewStore } from "@/stores/usePageViewStore";

/** One source for the header and the editor, so they always agree on width and font. */
export function usePageLayout(pageId: string): PageLayoutClasses {
  const editorWidth = useSettingsStore((s) => s.editorWidth);
  const view = usePageViewStore((s) => s.viewsByPageId[pageId]);
  return getPageLayoutClasses(view, EDITOR_WIDTH_CLASSES[editorWidth]);
}
