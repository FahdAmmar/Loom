import { Minimize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/useT";
import { useFocusModeStore } from "@/stores/useFocusModeStore";

/** The only chrome left in focus mode — quiet until hovered or focused, never fully hidden. */
export function FocusModeExit() {
  const t = useT();
  const exit = useFocusModeStore((s) => s.exit);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground fixed end-3 top-3 z-40 gap-1.5 opacity-50 transition-opacity hover:opacity-100 focus-visible:opacity-100 print:hidden"
      onClick={exit}
    >
      <Minimize2 className="size-3.5" />
      {t("focus.exit")}
    </Button>
  );
}
