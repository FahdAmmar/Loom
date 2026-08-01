import { useMemo, useRef, type ReactNode } from "react";

import { EditorFocusContext, type EditorFocusApi } from "@/features/editor/useEditorFocus";

export function EditorFocusProvider({ children }: { children: ReactNode }) {
  const registry = useRef(new Map<string, () => void>());

  const api = useMemo<EditorFocusApi>(
    () => ({
      register: (blockId, focusFn) => {
        registry.current.set(blockId, focusFn);
        return () => {
          if (registry.current.get(blockId) === focusFn) registry.current.delete(blockId);
        };
      },
      focus: (blockId) => {
        if (blockId) registry.current.get(blockId)?.();
      },
    }),
    [],
  );

  return <EditorFocusContext.Provider value={api}>{children}</EditorFocusContext.Provider>;
}
