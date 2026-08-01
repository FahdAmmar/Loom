import { createContext, useContext } from "react";

export interface EditorFocusApi {
  register: (blockId: string, focusFn: () => void) => () => void;
  focus: (blockId: string | null | undefined) => void;
}

// Lives here (a non-component file) rather than in EditorFocusContext.tsx so
// that file only exports the Provider component — keeps Fast Refresh happy.
export const EditorFocusContext = createContext<EditorFocusApi | null>(null);

export function useEditorFocus(): EditorFocusApi {
  const ctx = useContext(EditorFocusContext);
  if (!ctx) throw new Error("useEditorFocus must be used within an EditorFocusProvider");
  return ctx;
}
