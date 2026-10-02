import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { usePrintLightTheme } from "./usePrintLightTheme";
import { useSettingsStore } from "@/stores/useSettingsStore";

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
  useSettingsStore.setState({ theme: "system" });
});

describe("usePrintLightTheme", () => {
  it("drops the dark class while printing and restores it afterwards", () => {
    useSettingsStore.setState({ theme: "dark" });
    document.documentElement.classList.add("dark");
    renderHook(() => usePrintLightTheme());

    window.dispatchEvent(new Event("beforeprint"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    window.dispatchEvent(new Event("afterprint"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("leaves a light theme light after printing", () => {
    useSettingsStore.setState({ theme: "light" });
    renderHook(() => usePrintLightTheme());
    window.dispatchEvent(new Event("beforeprint"));
    window.dispatchEvent(new Event("afterprint"));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("stops listening once unmounted", () => {
    useSettingsStore.setState({ theme: "dark" });
    document.documentElement.classList.add("dark");
    const { unmount } = renderHook(() => usePrintLightTheme());
    unmount();
    window.dispatchEvent(new Event("beforeprint"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
