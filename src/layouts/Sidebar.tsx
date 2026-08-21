import { useRef } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  FileStack,
  Network,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { NavLink } from "react-router";

import { Button } from "@/components/ui/button";
import { FavoritesList } from "@/features/workspace/components/FavoritesList";
import { PageTree } from "@/features/workspace/components/PageTree";
import { RecentsList } from "@/features/workspace/components/RecentsList";
import { useDialogElement } from "@/hooks/useDialogElement";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/useSidebarStore";

const WORKSPACE_ID = "default";

const NAV_ITEMS = [
  { to: `/w/${WORKSPACE_ID}/graph`, label: "Graph", icon: Network },
  { to: `/w/${WORKSPACE_ID}/tags`, label: "Tags", icon: Tag },
  { to: `/w/${WORKSPACE_ID}/templates`, label: "Templates", icon: FileStack },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          viewTransition
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              isActive && "bg-secondary text-secondary-foreground font-medium",
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function SettingsLink({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      viewTransition
      to="/settings"
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm",
          isActive && "bg-secondary text-secondary-foreground font-medium",
        )
      }
    >
      <Settings className="size-4 shrink-0" />
      {!collapsed && "Settings"}
    </NavLink>
  );
}

/** Shared body for the desktop rail and the mobile drawer. */
function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto py-3">
      <FavoritesList onNavigate={onNavigate} />
      <RecentsList onNavigate={onNavigate} />
      <PageTree onNavigate={onNavigate} />
      <NavList onNavigate={onNavigate} />
    </div>
  );
}

export function Sidebar() {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const isMobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  const dialogRef = useRef<HTMLDialogElement>(null);
  useDialogElement(dialogRef, isMobileOpen);

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "border-border bg-background hidden shrink-0 flex-col border-r md:flex",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {isCollapsed ? (
          <div className="py-3">
            <NavList />
          </div>
        ) : (
          <SidebarBody />
        )}
        <div className="border-border border-t px-2 py-2">
          <SettingsLink collapsed={isCollapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="size-4 shrink-0" />
            ) : (
              <>
                <ChevronsLeft className="size-4 shrink-0" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer — a real <dialog>, not a div wearing role="dialog".
          Dismiss paths are explicit and keyboard-reachable: the close
          button, a nav/page tap, or native ESC handling. */}
      <dialog
        ref={dialogRef}
        aria-label="Navigation"
        onClose={closeMobile}
        className={cn(
          "drawer-animated border-border bg-background m-0 h-dvh max-h-dvh w-64 max-w-none border-0 border-r p-0",
          "backdrop:bg-black/40",
          "fixed inset-y-0 left-0 md:hidden",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <span className="text-muted-foreground text-sm font-medium">Navigation</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={closeMobile}
            >
              <X className="size-4" />
            </Button>
          </div>
          <SidebarBody onNavigate={closeMobile} />
          <div className="border-border border-t px-2 py-2">
            <SettingsLink onNavigate={closeMobile} />
          </div>
        </div>
      </dialog>
    </>
  );
}
