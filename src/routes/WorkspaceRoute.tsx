import { FilePlus, Home, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";

import * as backupApi from "@/api/backup";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { usePageStore } from "@/stores/usePageStore";

export function WorkspaceRoute() {
  const { workspaceId } = useParams();
  const pagesById = usePageStore((s) => s.pagesById);
  const isLoading = usePageStore((s) => s.isLoading);
  const createPage = usePageStore((s) => s.createPage);
  const navigate = useNavigate();
  const [isResetting, setResetting] = useState(false);

  const hasPages = Object.keys(pagesById).length > 0;

  if (isLoading) return null;

  async function handleNewPage() {
    const page = await createPage(workspaceId ?? "default", null);
    navigate(`/w/${workspaceId}/p/${page.id}`, { viewTransition: true });
  }

  async function handleLoadDemoContent() {
    setResetting(true);
    await backupApi.resetWorkspaceToDemoContent();
    // A full reload guarantees every store reflects the freshly-loaded data.
    window.location.assign(`/w/${workspaceId ?? "default"}`);
  }

  if (!hasPages) {
    return (
      <EmptyState
        icon={<FilePlus className="size-5" />}
        title="Create your first page"
        description="Everything in Loom starts as a page — or load the built-in demo content to see
          Loom with sample pages, tags, and templates already in place."
        action={
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" onClick={handleNewPage}>
              New page
            </Button>
            <Button size="sm" variant="outline" onClick={handleLoadDemoContent}>
              {isResetting ? (
                <RotateCcw className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Load demo content
            </Button>
          </div>
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
