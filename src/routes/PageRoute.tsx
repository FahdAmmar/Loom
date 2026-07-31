import { useEffect } from "react";
import { FileQuestion, FileText } from "lucide-react";
import { Link, useParams } from "react-router";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/features/pages/components/PageHeader";
import { usePageStore } from "@/stores/usePageStore";

export function PageRoute() {
  const { pageId, workspaceId } = useParams();
  const page = usePageStore((s) => (pageId ? s.pagesById[pageId] : undefined));
  const isLoading = usePageStore((s) => s.isLoading);
  const setCurrentPage = usePageStore((s) => s.setCurrentPage);

  useEffect(() => {
    setCurrentPage(pageId ?? null);
    return () => setCurrentPage(null);
  }, [pageId, setCurrentPage]);

  if (!page) {
    if (isLoading) return null; // avoid a "not found" flash while pages are still loading
    return (
      <EmptyState
        icon={<FileQuestion className="size-5" />}
        title="This page doesn't exist"
        description="It may have been deleted, or the link is out of date."
        action={
          <Link
            to={`/w/${workspaceId}`}
            className="text-primary mt-2 text-sm font-medium hover:underline"
          >
            Back to workspace
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <PageHeader key={page.id} page={page} />
      <EmptyState
        icon={<FileText className="size-5" />}
        title="The editor isn't built yet"
        description="Blocks, formatting, and slash commands arrive in Phase 3 — Editor."
      />
    </div>
  );
}
