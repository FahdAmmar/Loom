import { Plus } from "lucide-react";
import { useNavigate } from "react-router";

import { PageTreeItem } from "@/features/pages/components/PageTreeItem";
import { PageTreeSkeleton } from "@/features/pages/components/PageTreeSkeleton";
import { buildPageTree } from "@/lib/tree";
import { usePageStore } from "@/stores/usePageStore";

const WORKSPACE_ID = "default";

export function PageTree({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const isLoading = usePageStore((s) => s.isLoading);
  const error = usePageStore((s) => s.error);
  const createPage = usePageStore((s) => s.createPage);

  const tree = buildPageTree(pagesById);

  async function handleNewPage() {
    const page = await createPage(WORKSPACE_ID, null);
    navigate(`/w/${WORKSPACE_ID}/p/${page.id}`);
    onNavigate?.();
  }

  return (
    <div className="flex flex-1 flex-col gap-1">
      <div className="flex items-center justify-between px-3">
        <span className="text-text-faint text-xs font-medium tracking-wide uppercase">
          Workspace
        </span>
        <button
          type="button"
          onClick={handleNewPage}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-6 items-center justify-center rounded"
          aria-label="New page"
          title="New page"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {isLoading ? (
        <PageTreeSkeleton />
      ) : error ? (
        <p className="text-destructive px-3 py-1 text-sm">{error}</p>
      ) : tree.length === 0 ? (
        <p className="text-text-faint px-3 py-1 text-sm">No pages yet.</p>
      ) : (
        <div className="px-1">
          {tree.map((node) => (
            <PageTreeItem key={node.page.id} node={node} depth={0} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
