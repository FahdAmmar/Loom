import { Star } from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/lib/utils";
import { usePageStore } from "@/stores/usePageStore";

const WORKSPACE_ID = "default";

export function FavoritesList({ onNavigate }: { onNavigate?: () => void }) {
  const pagesById = usePageStore((s) => s.pagesById);
  const favorites = Object.values(pagesById)
    .filter((p) => p.isFavorite)
    .sort((a, b) => a.title.localeCompare(b.title));

  if (favorites.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-text-faint px-3 text-xs font-medium tracking-wide uppercase">
        Favorites
      </span>
      <nav className="flex flex-col gap-0.5 px-1">
        {favorites.map((page) => (
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
            <Star className="text-brand-gold size-3.5 shrink-0 fill-current" />
            <span className="truncate">{page.title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
