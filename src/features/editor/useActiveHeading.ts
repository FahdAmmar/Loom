import { useEffect, useState } from "react";

/** Elements are found by the `data-block-id` that BlockRow puts on every block. */
export function findBlockElement(blockId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-block-id="${CSS.escape(blockId)}"]`);
}

/**
 * The heading the reader is currently in: the first one inside the top band
 * of the viewport, or the last one that scrolled past it.
 */
export function useActiveHeading(blockIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const idsKey = blockIds.join("|");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ids = idsKey ? idsKey.split("|") : [];
    const inBand = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.blockId;
          if (!id) continue;
          if (entry.isIntersecting) inBand.add(id);
          else inBand.delete(id);
        }
        const firstInBand = ids.find((id) => inBand.has(id));
        // Nothing in the band: keep the last heading, the reader is still inside its section.
        if (firstInBand) setActiveId(firstInBand);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );

    for (const id of ids) {
      const element = findBlockElement(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [idsKey]);

  return activeId;
}
