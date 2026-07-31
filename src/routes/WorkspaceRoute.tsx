import { FilePlus, Home } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { usePageStore } from "@/stores/usePageStore";

export function WorkspaceRoute() {
  const { workspaceId } = useParams();
  const pagesById = usePageStore((s) => s.pagesById);
  const isLoading = usePageStore((s) => s.isLoading);
  const createPage = usePageStore((s) => s.createPage);
  const navigate = useNavigate();

  const hasPages = Object.keys(pagesById).length > 0;

  if (isLoading) return null;

  async function handleNewPage() {
    const page = await createPage(workspaceId ?? "default", null);
    navigate(`/w/${workspaceId}/p/${page.id}`);
  }

  if (!hasPages) {
    return (
      <EmptyState
        icon={<FilePlus className="size-5" />}
        title="Create your first page"
        description="Everything in Loom starts as a page — you can nest others inside it once it exists."
        action={
          <Button size="sm" className="mt-2" onClick={handleNewPage}>
            New page
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<Home className="size-5" />}
      title="Pick a page from the sidebar"
      description="Or start a new one — the block editor for whatever you write arrives in Phase 3."
      action={
        <Button variant="outline" size="sm" className="mt-2" onClick={handleNewPage}>
          New page
        </Button>
      }
    />
  );
}
