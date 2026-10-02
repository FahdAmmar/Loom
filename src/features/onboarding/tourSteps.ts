import type { MessageKey } from "@/i18n";

export interface TourStep {
  title: MessageKey;
  body: MessageKey;
}

export const TOUR_STEPS: TourStep[] = [
  { title: "tour.step1.title", body: "tour.step1.body" },
  { title: "tour.step2.title", body: "tour.step2.body" },
  { title: "tour.step3.title", body: "tour.step3.body" },
  { title: "tour.step4.title", body: "tour.step4.body" },
];
