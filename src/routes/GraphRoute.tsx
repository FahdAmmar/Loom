import { Network } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";

export function GraphRoute() {
  return (
    <EmptyState
      icon={<Network className="size-5" />}
      title="Nothing to graph yet"
      description="Once pages and [[links]] exist, this view renders them as nodes and edges — arriving in Phase 4 — Knowledge Graph."
    />
  );
}
