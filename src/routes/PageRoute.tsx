import { lazy, Suspense, useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Link, useParams } from "react-router";

import { EmptyState } from "@/components/EmptyState";
import { EditorSkeleton } from "@/features/editor/components/EditorSkeleton";
import { BacklinksPanel } from "@/features/pages/components/BacklinksPanel";
import { PageHeader } from "@/features/pages/components/PageHeader";
import { usePageStore } from "@/stores/usePageStore";

const Editor = lazy(() =>
  import("@/features/editor/components/Editor").then((m) => ({ default: m.Editor })),
);

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
      <Suspense fallback={<EditorSkeleton />}>
        <Editor key={page.id} pageId={page.id} />
      </Suspense>
      <BacklinksPanel key={`backlinks-${page.id}`} pageId={page.id} />
    </div>
  );
}
