import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

afterEach(() => vi.restoreAllMocks());

describe("useOnlineStatus", () => {
  it("follows the browser's online and offline events", () => {
    const flag = vi.spyOn(navigator, "onLine", "get");
    flag.mockReturnValue(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    flag.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(result.current).toBe(false);

    flag.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event("online")));
    expect(result.current).toBe(true);
  });
});
