import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  ToastContext,
  type ToastAction,
  type ToastApi,
  type ToastVariant,
} from "@/hooks/useToast";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

const AUTO_DISMISS_MS = 3200;
// A toast offering "Undo" needs more than a glance to act on — give it
// noticeably longer before it disappears than a plain confirmation.
const AUTO_DISMISS_WITH_ACTION_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "default", action?: ToastAction) => {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, message, variant, action }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), action ? AUTO_DISMISS_WITH_ACTION_MS : AUTO_DISMISS_MS),
      );
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <output
        aria-live="polite"
        className="pointer-events-none fixed end-4 bottom-4 z-[100] flex flex-col gap-2 print:hidden"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="border-border bg-popover text-popover-foreground animate-toast-in pointer-events-auto flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm shadow-lg"
          >
            {item.variant === "success" && (
              <CheckCircle2 className="text-brand-mint size-4 shrink-0" />
            )}
            {item.variant === "error" && (
              <AlertCircle className="text-destructive size-4 shrink-0" />
            )}
            {item.message}
            {item.action && (
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  dismiss(item.id);
                }}
                className="text-brand-violet -my-1 ms-1 shrink-0 font-medium hover:underline"
              >
                {item.action.label}
              </button>
            )}
          </div>
        ))}
      </output>
    </ToastContext.Provider>
  );
}
