import { FileStack } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";

export function TemplatesRoute() {
  return (
    <EmptyState
      icon={<FileStack className="size-5" />}
      title="No templates yet"
      description="Saving a page as a reusable template arrives in Phase 6 — Productivity."
    />
  );
}
