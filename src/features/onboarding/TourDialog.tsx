import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { TOUR_STEPS } from "@/features/onboarding/tourSteps";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/stores/useOnboardingStore";

export function TourDialog() {
  const t = useT();
  const isOpen = useOnboardingStore((s) => s.isOpen);
  const close = useOnboardingStore((s) => s.close);
  const [stepIndex, setStepIndex] = useState(0);

  const step = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  function finish() {
    close();
    setStepIndex(0); // a replay starts from the beginning
  }

  return (
    <Dialog
      open={isOpen}
      onClose={finish}
      aria-label={t("tour.label")}
      className="w-[min(28rem,calc(100vw-2rem))] p-0"
    >
      <div className="p-6">
        <p className="text-muted-foreground text-xs font-medium tabular-nums">
          {t("tour.progress", { step: stepIndex + 1, total: TOUR_STEPS.length })}
        </p>
        <h2 className="text-foreground mt-2 text-lg font-semibold">{t(step.title)}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t(step.body)}</p>

        <div className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
          {TOUR_STEPS.map((tourStep, index) => (
            <span
              key={tourStep.title}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === stepIndex ? "bg-primary w-5" : "bg-border w-1.5",
              )}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            {t("tour.skip")}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isFirst}
              onClick={() => setStepIndex((i) => i - 1)}
            >
              {t("tour.back")}
            </Button>
            <Button size="sm" onClick={isLast ? finish : () => setStepIndex((i) => i + 1)}>
              {t(isLast ? "tour.done" : "tour.next")}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
