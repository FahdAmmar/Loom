import { Tag } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";

export function TagsRoute() {
  return (
    <EmptyState
      icon={<Tag className="size-5" />}
      title="No tags yet"
      description="Tagging pages and filtering by tag arrive in Phase 6 — Productivity."
    />
  );
}
