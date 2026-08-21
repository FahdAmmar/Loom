import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, FileText, GripVertical, Plus } from "lucide-react";
import { NavLink, useNavigate } from "react-router";

import { PageActionsMenu } from "@/features/pages/components/PageActionsMenu";
import { cn } from "@/lib/utils";
import { usePageStore } from "@/stores/usePageStore";
import { useSidebarStore } from "@/stores/useSidebarStore";
import type { Page } from "@/types/entities";

const WORKSPACE_ID = "default";

interface PageTreeItemProps {
  page: Page;
  depth: number;
  hasChildren: boolean;
  onNavigate?: () => void;
}

export function PageTreeItem({ page, depth, hasChildren, onNavigate }: PageTreeItemProps) {
  const navigate = useNavigate();
  const createPage = usePageStore((s) => s.createPage);

  const isCollapsed = useSidebarStore((s) => Boolean(s.collapsedPageIds[page.id]));
  const toggleExpanded = useSidebarStore((s) => s.togglePageExpanded);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  async function handleAddSubpage() {
    const child = await createPage(WORKSPACE_ID, page.id);
    if (isCollapsed) toggleExpanded(page.id);
    navigate(`/w/${WORKSPACE_ID}/p/${child.id}`, { viewTransition: true });
    onNavigate?.();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group hover:bg-accent flex items-center rounded-md pr-1",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${page.title}`}
        className="text-text-faint hover:text-foreground flex size-5 shrink-0 cursor-grab touch-none items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        style={{ marginLeft: depth * 12 }}
      >
        <GripVertical className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={() => toggleExpanded(page.id)}
        className={cn(
          "text-muted-foreground flex size-6 shrink-0 items-center justify-center",
          !hasChildren && "invisible",
        )}
        aria-label={isCollapsed ? "Expand" : "Collapse"}
        aria-expanded={!isCollapsed}
      >
        <ChevronRight
          className={cn("size-3.5 transition-transform", !isCollapsed && "rotate-90")}
        />
      </button>

      <NavLink
        to={`/w/${WORKSPACE_ID}/p/${page.id}`}
        onClick={onNavigate}
        viewTransition
        className={({ isActive }) =>
          cn(
            "text-muted-foreground flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pr-1 text-sm",
            isActive && "text-foreground font-medium",
          )
        }
      >
        <FileText className="size-3.5 shrink-0" />
        <span className="truncate">{page.title}</span>
      </NavLink>

      <button
        type="button"
        onClick={handleAddSubpage}
        className="text-muted-foreground hover:bg-secondary flex size-6 shrink-0 items-center justify-center rounded opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
        aria-label={`Add a page inside ${page.title}`}
        title="Add subpage"
      >
        <Plus className="size-3.5" />
      </button>

      <PageActionsMenu
        pageId={page.id}
        pageTitle={page.title}
        triggerClassName="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-secondary group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
      />
    </div>
  );
}
