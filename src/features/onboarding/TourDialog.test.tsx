import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { TourDialog } from "./TourDialog";
import { TOUR_STEPS } from "./tourSteps";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { useSettingsStore } from "@/stores/useSettingsStore";

// jsdom has no <dialog> modal support; a minimal stand-in keeps the open state observable.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  localStorage.clear();
  useOnboardingStore.setState({ hasSeenTour: false, isOpen: true });
});
afterEach(() => {
  cleanup();
  useSettingsStore.getState().setDirection("ltr");
});

describe("TourDialog", () => {
  it("opens on the first step with Back disabled", () => {
    render(<TourDialog />);
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome to Loom" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("walks forward and back through every step", () => {
    render(<TourDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(TOUR_STEPS).toHaveLength(4);
  });

  it("finishes on the last step, marks the tour seen, and starts over next time", () => {
    render(<TourDialog />);
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
    }
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    expect(useOnboardingStore.getState()).toMatchObject({ isOpen: false, hasSeenTour: true });

    useOnboardingStore.getState().open();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
  });

  it("lets the user skip from any step", () => {
    render(<TourDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(useOnboardingStore.getState()).toMatchObject({ isOpen: false, hasSeenTour: true });
  });

  it("reads in Arabic when the interface language is Arabic", () => {
    useSettingsStore.getState().setDirection("rtl");
    render(<TourDialog />);
    expect(screen.getByRole("heading", { name: "مرحباً بك في Loom" })).toBeInTheDocument();
    expect(screen.getByText("الخطوة 1 من 4")).toBeInTheDocument();
  });
});
