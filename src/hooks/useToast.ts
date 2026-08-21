import { createContext, useContext } from "react";

export type ToastVariant = "default" | "success" | "error";

export interface ToastApi {
  toast: (message: string, variant?: ToastVariant) => void;
}

// Lives here (a non-component file) rather than in toast.tsx so that file
// only exports the Provider component — keeps Fast Refresh happy.
export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
