import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names and resolves conflicting Tailwind
 * utility classes (e.g. "p-2" vs "p-4") in favor of the last one.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Moves the item at `from` to sit at `to`, both indices measured in the
 * *original* array — matching `@dnd-kit/sortable`'s `arrayMove` semantics
 * exactly, so a drag-and-drop caller can pass the target's raw index
 * straight through without adjusting for whether the drag moved forward or
 * backward. Pure and dependency-free, so the mock API layer (api/blocks.ts,
 * api/pages.ts) can reuse it too without pulling in a UI library.
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const next = array.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
