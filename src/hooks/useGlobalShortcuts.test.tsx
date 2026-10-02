import { fireEvent, renderHook, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { useGlobalShortcuts } from "./useGlobalShortcuts";
import { useFocusModeStore } from "@/stores/useFocusModeStore";

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

afterEach(() => {
  cleanup();
  useFocusModeStore.setState({ isFocused: false });
});

describe("useGlobalShortcuts — focus mode", () => {
  it("toggles focus mode with ⌘⇧F", () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    fireEvent.keyDown(window, { key: "F", metaKey: true, shiftKey: true });
    expect(useFocusModeStore.getState().isFocused).toBe(true);
    fireEvent.keyDown(window, { key: "f", ctrlKey: true, shiftKey: true });
    expect(useFocusModeStore.getState().isFocused).toBe(false);
  });

  it("ignores ⌘F without Shift so the browser's find keeps working", () => {
    renderHook(() => useGlobalShortcuts(), { wrapper });
    fireEvent.keyDown(window, { key: "f", metaKey: true });
    expect(useFocusModeStore.getState().isFocused).toBe(false);
  });
});
