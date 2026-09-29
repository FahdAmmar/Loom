import { EDITOR_WIDTH_CLASSES, useSettingsStore } from "@/stores/useSettingsStore";

export function EditorSkeleton() {
  const editorWidth = useSettingsStore((s) => s.editorWidth);

  return (
    <div
      className={`mx-auto flex flex-col gap-3 px-6 py-6 ${EDITOR_WIDTH_CLASSES[editorWidth]}`}
      aria-hidden="true"
    >
      <div className="bg-muted h-7 w-2/5 animate-pulse rounded" />
      <div className="bg-muted h-4 w-full animate-pulse rounded" />
      <div className="bg-muted h-4 w-5/6 animate-pulse rounded" />
      <div className="bg-muted mt-2 h-4 w-3/4 animate-pulse rounded" />
    </div>
  );
}
