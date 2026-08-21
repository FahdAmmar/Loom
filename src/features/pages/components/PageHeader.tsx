import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { PageActionsMenu } from "@/features/pages/components/PageActionsMenu";
import { PageProperties } from "@/features/pages/components/PageProperties";
import { PageTags } from "@/features/pages/components/PageTags";
import { getAncestors } from "@/lib/tree";
import { usePageStore } from "@/stores/usePageStore";
import { useEditorStore } from "@/stores/useEditorStore";
import type { Page } from "@/types/entities";

const WORKSPACE_ID = "default";

function SaveStatusIndicator() {
  const saveStatus = useEditorStore((s) => s.saveStatus);
  if (saveStatus === "idle") return null;
  return (
    <output className="text-text-faint shrink-0 text-xs">
      {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : "Couldn't save"}
    </output>
  );
}

export function PageHeader({ page }: { page: Page }) {
  const navigate = useNavigate();
  const pagesById = usePageStore((s) => s.pagesById);
  const renamePage = usePageStore((s) => s.renamePage);
  const [title, setTitle] = useState(page.title);

  const ancestors = getAncestors(pagesById, page.id);

  function commitTitle() {
    const trimmed = title.trim();
    if (trimmed && trimmed !== page.title) {
      renamePage(page.id, trimmed);
    } else {
      setTitle(page.title);
    }
  }

  return (
    <div className="border-border border-b px-6 py-4">
      <div className="mx-auto max-w-3xl">
        <nav
          aria-label="Breadcrumb"
          className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm"
        >
          <Link viewTransition to={`/w/${WORKSPACE_ID}`} className="hover:text-foreground">
            Workspace
          </Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              <ChevronRight className="size-3.5 shrink-0" />
              <Link
                viewTransition
                to={`/w/${WORKSPACE_ID}/p/${ancestor.id}`}
                className="hover:text-foreground truncate"
              >
                {ancestor.title}
              </Link>
            </span>
          ))}
        </nav>

        <div className="mt-2 flex items-center gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            aria-label="Page title"
            placeholder="Untitled"
            className="text-foreground focus-visible:bg-accent -mx-1 min-w-0 flex-1 rounded-md bg-transparent px-1 text-2xl font-semibold outline-none"
          />
          <SaveStatusIndicator />
          <PageActionsMenu
            pageId={page.id}
            pageTitle={page.title}
            onDeleted={() => navigate(`/w/${WORKSPACE_ID}`, { viewTransition: true })}
            triggerClassName="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          />
        </div>

        <PageTags pageId={page.id} />
        <PageProperties pageId={page.id} />
      </div>
    </div>
  );
}
