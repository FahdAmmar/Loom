import { Type } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { MessageKey } from "@/i18n";
import { useT } from "@/i18n/useT";
import {
  DEFAULT_PAGE_VIEW,
  isDefaultPageView,
  type PageFont,
  type PageTextSize,
  type PageView,
} from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { usePageViewStore } from "@/stores/usePageViewStore";

interface Choice<T> {
  value: T;
  label: MessageKey;
}

const FONTS: Choice<PageFont>[] = [
  { value: "sans", label: "common.default" },
  { value: "serif", label: "pageStyle.fontSerif" },
  { value: "mono", label: "pageStyle.fontMono" },
];
const TEXT_SIZES: Choice<PageTextSize>[] = [
  { value: "small", label: "pageStyle.small" },
  { value: "default", label: "common.default" },
  { value: "large", label: "pageStyle.large" },
];
const WIDTHS: Choice<boolean>[] = [
  { value: false, label: "pageStyle.standard" },
  { value: true, label: "pageStyle.fullWidth" },
];

function ChoiceRow<T extends string | boolean>({
  legend,
  choices,
  value,
  onChange,
}: {
  legend: MessageKey;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const t = useT();
  return (
    <fieldset className="mt-4">
      <legend className="text-foreground mb-1.5 text-sm font-medium">{t(legend)}</legend>
      <div className="flex gap-2">
        {choices.map((choice) => {
          const isSelected = choice.value === value;
          return (
            <Button
              key={String(choice.value)}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "outline"}
              aria-pressed={isSelected}
              className={cn("flex-1", !isSelected && "text-muted-foreground")}
              onClick={() => onChange(choice.value)}
            >
              {t(choice.label)}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Header button + dialog for how this one page looks (font, text size, width). */
export function PageStyleButton({ pageId }: { pageId: string }) {
  const t = useT();
  const [isOpen, setOpen] = useState(false);
  const stored = usePageViewStore((s) => s.viewsByPageId[pageId]);
  const setView = usePageViewStore((s) => s.setView);
  const resetView = usePageViewStore((s) => s.resetView);
  const view: PageView = { ...DEFAULT_PAGE_VIEW, ...stored };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 print:hidden"
        aria-label={t("pageStyle.title")}
        title={t("pageStyle.title")}
        onClick={() => setOpen(true)}
      >
        <Type className="size-4" />
      </Button>

      <Dialog open={isOpen} onClose={() => setOpen(false)} aria-label={t("pageStyle.title")}>
        <div className="p-5">
          <h2 className="text-foreground text-base font-semibold">{t("pageStyle.title")}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{t("pageStyle.scope")}</p>

          <ChoiceRow
            legend="pageStyle.font"
            choices={FONTS}
            value={view.font}
            onChange={(font) => setView(pageId, { font })}
          />
          <ChoiceRow
            legend="pageStyle.textSize"
            choices={TEXT_SIZES}
            value={view.textSize}
            onChange={(textSize) => setView(pageId, { textSize })}
          />
          <ChoiceRow
            legend="pageStyle.width"
            choices={WIDTHS}
            value={view.fullWidth}
            onChange={(fullWidth) => setView(pageId, { fullWidth })}
          />

          <div className="mt-6 flex justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDefaultPageView(stored)}
              onClick={() => resetView(pageId)}
            >
              {t("pageStyle.reset")}
            </Button>
            <Button size="sm" onClick={() => setOpen(false)}>
              {t("pageStyle.done")}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
