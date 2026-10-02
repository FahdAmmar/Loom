import { X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

/**
 * A new build's service worker downloads in the background and just
 * waits — it never takes over automatically (see `registerType: "prompt"`
 * in vite.config.ts), so an in-progress edit is never interrupted by a
 * surprise reload. This is the one UI surface where the person actually
 * chooses to reload and pick up the new version.
 */
export function UpdatePrompt() {
  const { toast } = useToast();
  const {
    needRefresh: [needsRefresh, setNeedsRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onOfflineReady() {
      toast("Loom is ready to work offline.", "success");
    },
  });

  if (!needsRefresh) return null;

  return (
    <output className="border-border bg-popover text-popover-foreground animate-toast-in fixed end-4 bottom-4 z-[100] flex items-center gap-3 rounded-md border px-4 py-3 text-sm shadow-lg print:hidden">
      <span>A new version of Loom is available.</span>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>
        Reload
      </Button>
      <button
        type="button"
        onClick={() => setNeedsRefresh(false)}
        aria-label="Dismiss"
        className="text-text-faint hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </output>
  );
}
