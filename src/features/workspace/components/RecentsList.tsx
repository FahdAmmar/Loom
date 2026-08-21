import { Clock } from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/lib/utils";
import { usePageStore } from "@/stores/usePageStore";

const WORKSPACE_ID = "default";

export function RecentsList({ onNavigate }: { onNavigate?: () => void }) {
  const pagesById = usePageStore((s) => s.pagesById);
  const recentPageIds = usePageStore((s) => s.recentPageIds);
  const recents = recentPageIds.map((id) => pagesById[id]).filter((p) => Boolean(p));

  if (recents.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-text-faint px-3 text-xs font-medium tracking-wide uppercase">
        Recent
      </span>
      <nav className="flex flex-col gap-0.5 px-1">
        {recents.map((page) => (
          <NavLink
            viewTransition
            key={page.id}
            to={`/w/${WORKSPACE_ID}/p/${page.id}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                isActive && "bg-secondary text-secondary-foreground font-medium",
              )
            }
          >
            <Clock className="size-3.5 shrink-0" />
            <span className="truncate">{page.title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
