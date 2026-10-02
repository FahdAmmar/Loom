import { beforeEach, describe, expect, it } from "vitest";

import { useOnboardingStore } from "./useOnboardingStore";

beforeEach(() => {
  localStorage.clear();
  useOnboardingStore.setState({ hasSeenTour: false, isOpen: false });
});

describe("useOnboardingStore", () => {
  it("starts unseen and closed", () => {
    expect(useOnboardingStore.getState()).toMatchObject({ hasSeenTour: false, isOpen: false });
  });

  it("counts any close as having seen the tour", () => {
    useOnboardingStore.getState().open();
    expect(useOnboardingStore.getState().isOpen).toBe(true);
    useOnboardingStore.getState().close();
    expect(useOnboardingStore.getState()).toMatchObject({ hasSeenTour: true, isOpen: false });
  });

  it("remembers having seen it, but never that it was open", () => {
    useOnboardingStore.getState().open();
    useOnboardingStore.getState().close();
    useOnboardingStore.getState().open();

    const stored = JSON.parse(localStorage.getItem("loom-onboarding") ?? "{}") as {
      state: Record<string, unknown>;
    };
    expect(stored.state).toEqual({ hasSeenTour: true });
  });
});
