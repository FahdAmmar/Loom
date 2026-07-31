import { ChevronRight, FileText, Plus } from "lucide-react";
import { NavLink, useNavigate } from "react-router";

import { PageActionsMenu } from "@/features/pages/components/PageActionsMenu";
import type { PageTreeNode } from "@/lib/tree";
import { cn } from "@/lib/utils";
import { usePageStore } from "@/stores/usePageStore";
import { useSidebarStore } from "@/stores/useSidebarStore";

const WORKSPACE_ID = "default";

interface PageTreeItemProps {
  node: PageTreeNode;
  depth: number;
  onNavigate?: () => void;
}

export function PageTreeItem({ node, depth, onNavigate }: PageTreeItemProps) {
  const navigate = useNavigate();
  const createPage = usePageStore((s) => s.createPage);

  const isCollapsed = useSidebarStore((s) => Boolean(s.collapsedPageIds[node.page.id]));
  const toggleExpanded = useSidebarStore((s) => s.togglePageExpanded);

  const hasChildren = node.children.length > 0;

  async function handleAddSubpage() {
    const child = await createPage(WORKSPACE_ID, node.page.id);
    if (isCollapsed) toggleExpanded(node.page.id);
    navigate(`/w/${WORKSPACE_ID}/p/${child.id}`);
    onNavigate?.();
  }

  return (
    <div>
      <div className="group hover:bg-accent flex items-center rounded-md pr-1">
        <button
          type="button"
          onClick={() => toggleExpanded(node.page.id)}
          className={cn(
            "text-muted-foreground flex size-7 shrink-0 items-center justify-center",
            !hasChildren && "invisible",
          )}
          style={{ marginLeft: depth * 12 }}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
          aria-expanded={!isCollapsed}
        >
          <ChevronRight
            className={cn("size-3.5 transition-transform", !isCollapsed && "rotate-90")}
          />
        </button>

        <NavLink
          to={`/w/${WORKSPACE_ID}/p/${node.page.id}`}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "text-muted-foreground flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-1 text-sm",
              isActive && "text-foreground font-medium",
            )
          }
        >
          <FileText className="size-3.5 shrink-0" />
          <span className="truncate">{node.page.title}</span>
        </NavLink>

        <button
          type="button"
          onClick={handleAddSubpage}
          className="text-muted-foreground hover:bg-secondary flex size-6 shrink-0 items-center justify-center rounded opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
          aria-label={`Add a page inside ${node.page.title}`}
          title="Add subpage"
        >
          <Plus className="size-3.5" />
        </button>

        <PageActionsMenu
          pageId={node.page.id}
          pageTitle={node.page.title}
          triggerClassName="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-secondary group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
        />
      </div>

      {hasChildren && !isCollapsed && (
        <div>
          {node.children.map((child) => (
            <PageTreeItem
              key={child.page.id}
              node={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
