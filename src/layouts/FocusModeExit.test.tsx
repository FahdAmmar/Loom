import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FocusModeExit } from "./FocusModeExit";
import { useFocusModeStore } from "@/stores/useFocusModeStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

afterEach(() => {
  cleanup();
  useSettingsStore.getState().setDirection("ltr");
  useFocusModeStore.setState({ isFocused: false });
});

describe("focus mode", () => {
  it("starts off and toggles on and off", () => {
    expect(useFocusModeStore.getState().isFocused).toBe(false);
    useFocusModeStore.getState().toggle();
    expect(useFocusModeStore.getState().isFocused).toBe(true);
    useFocusModeStore.getState().toggle();
    expect(useFocusModeStore.getState().isFocused).toBe(false);
  });

  it("leaves focus mode from the exit button", () => {
    useFocusModeStore.setState({ isFocused: true });
    render(<FocusModeExit />);
    fireEvent.click(screen.getByRole("button", { name: /exit focus/i }));
    expect(useFocusModeStore.getState().isFocused).toBe(false);
  });

  it("shows its label in Arabic when the interface language is Arabic", () => {
    useSettingsStore.getState().setDirection("rtl");
    render(<FocusModeExit />);
    expect(screen.getByRole("button", { name: "إنهاء التركيز" })).toBeInTheDocument();
  });
});
