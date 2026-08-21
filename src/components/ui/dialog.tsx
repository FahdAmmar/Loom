import { useRef, type ReactNode } from "react";

import { useDialogElement } from "@/hooks/useDialogElement";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  "aria-label": string;
  className?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, className, children, ...aria }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogElement(dialogRef, open);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={aria["aria-label"]}
      className={cn(
        "dialog-animated border-border bg-card text-card-foreground m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border p-0 shadow-lg",
        "backdrop:bg-black/40",
        className,
      )}
    >
      {children}
    </dialog>
  );
}
