import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useInstallPrompt } from "./useInstallPrompt";

afterEach(cleanup);

function installEvent() {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) });
  return { event, prompt };
}

describe("useInstallPrompt", () => {
  it("cannot install until the browser offers it", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it("holds the browser's prompt back and offers it on request", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const { event, prompt } = installEvent();

    act(() => {
      window.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await result.current.install();
    });
    expect(prompt).toHaveBeenCalledOnce();
    expect(result.current.canInstall).toBe(false); // one prompt per event
  });

  it("stops offering once the app is installed", () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => {
      window.dispatchEvent(installEvent().event);
    });
    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.canInstall).toBe(false);
  });
});
