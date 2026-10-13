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

describe("accent color", () => {
  afterEach(() => useSettingsStore.getState().setAccent("gold"));

  it("defaults to gold with no attribute on <html>", () => {
    expect(useSettingsStore.getInitialState().accent).toBe("gold");
    expect(document.documentElement.dataset.accent).toBeUndefined();
  });

  it("sets data-accent for a non-default accent", () => {
    useSettingsStore.getState().setAccent("violet");
    expect(document.documentElement.dataset.accent).toBe("violet");
  });

  it("removes the attribute when switched back to gold", () => {
    useSettingsStore.getState().setAccent("mint");
    useSettingsStore.getState().setAccent("gold");
    expect(document.documentElement.dataset.accent).toBeUndefined();
  });
});

describe("last backup time", () => {
  afterEach(() => useSettingsStore.setState({ lastBackupAt: null }));

  it("starts empty and records an ISO time when a backup is marked done", () => {
    expect(useSettingsStore.getInitialState().lastBackupAt).toBeNull();
    useSettingsStore.getState().markBackupDone();
    const stamp = useSettingsStore.getState().lastBackupAt;
    expect(stamp).not.toBeNull();
    expect(new Date(stamp!).toISOString()).toBe(stamp);
  });
});
