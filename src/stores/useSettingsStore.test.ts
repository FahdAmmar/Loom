import { afterEach, describe, expect, it } from "vitest";

import { applyDirection, useSettingsStore } from "./useSettingsStore";

describe("interface direction", () => {
  afterEach(() => useSettingsStore.getState().setDirection("ltr"));

  it("defaults to left-to-right", () => {
    expect(useSettingsStore.getInitialState().direction).toBe("ltr");
  });

  it("sets dir and lang on <html> when switched to RTL", () => {
    useSettingsStore.getState().setDirection("rtl");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(useSettingsStore.getState().direction).toBe("rtl");
  });

  it("restores dir and lang when switched back to LTR", () => {
    useSettingsStore.getState().setDirection("rtl");
    useSettingsStore.getState().setDirection("ltr");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.lang).toBe("en");
  });

  it("applyDirection alone does not touch the store", () => {
    applyDirection("rtl");
    expect(useSettingsStore.getState().direction).toBe("ltr");
    applyDirection("ltr");
  });
});
