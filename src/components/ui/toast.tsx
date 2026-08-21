import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { ToastContext, type ToastApi, type ToastVariant } from "@/hooks/useToast";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

const AUTO_DISMISS_MS = 3200;

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
    (message: string, variant: ToastVariant = "default") => {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, message, variant }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
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
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex flex-col gap-2"
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
          </div>
        ))}
      </output>
    </ToastContext.Provider>
  );
}
