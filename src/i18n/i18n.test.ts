import { cleanup, renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ar } from "./ar";
import { en } from "./en";
import { localeFromDirection, translate, type MessageKey } from "./index";
import { useT } from "./useT";
import { useSettingsStore } from "@/stores/useSettingsStore";

afterEach(() => {
  cleanup();
  useSettingsStore.getState().setDirection("ltr");
});

const KEYS = Object.keys(en) as MessageKey[];
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("have an Arabic entry for every English key and no extras", () => {
    expect(Object.keys(ar).sort()).toEqual([...KEYS].sort());
  });

  it("never leave a translation empty", () => {
    for (const key of KEYS) expect(ar[key].trim(), key).not.toBe("");
  });

  it("use the same {placeholders} in both languages", () => {
    for (const key of KEYS) expect(placeholders(ar[key]), key).toEqual(placeholders(en[key]));
  });
});

describe("translate", () => {
  it("returns the text for the locale", () => {
    expect(translate("en", "nav.settings")).toBe("Settings");
    expect(translate("ar", "nav.settings")).toBe("الإعدادات");
  });

  it("fills in {placeholders}", () => {
    expect(translate("en", "palette.createNamed", { title: "Ideas" })).toBe(
      'Create page "Ideas"',
    );
    expect(translate("ar", "history.undoWith", { label: "لصق" })).toBe("تراجع: لصق");
  });

  it("keeps a placeholder visible when its value is missing", () => {
    expect(translate("en", "palette.taggedWith", {})).toBe("Tagged #{tag}");
  });

  it("falls back to English when an entry is missing", () => {
    const original = ar["nav.tags"];
    // @ts-expect-error simulating a dictionary gap
    delete ar["nav.tags"];
    try {
      expect(translate("ar", "nav.tags")).toBe("Tags");
    } finally {
      ar["nav.tags"] = original;
    }
  });
});

describe("localeFromDirection / useT", () => {
  it("maps RTL to Arabic and LTR to English", () => {
    expect(localeFromDirection("rtl")).toBe("ar");
    expect(localeFromDirection("ltr")).toBe("en");
  });

  it("switches language when the direction setting changes", () => {
    const { result } = renderHook(() => useT());
    expect(result.current("nav.tags")).toBe("Tags");

    act(() => useSettingsStore.getState().setDirection("rtl"));
    expect(result.current("nav.tags")).toBe("الوسوم");
  });
});
