import { useEffect, type RefObject } from "react";

/**
 * Drives a native <dialog> element from a boolean `open` prop.
 * showModal()/close() give a real top-layer modal, focus trap, and
 * native ESC-to-close for free. Pair with `onClose` on the element
 * itself to keep external state in sync when ESC fires.
 */
export function useDialogElement(ref: RefObject<HTMLDialogElement | null>, open: boolean) {
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [ref, open]);
}
