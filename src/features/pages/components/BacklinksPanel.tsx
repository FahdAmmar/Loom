import { useEffect, useState } from "react";
import { FileText, Link2 } from "lucide-react";
import { Link } from "react-router";

import * as linksApi from "@/api/links";
import type { BacklinkResult } from "@/api/links";

const WORKSPACE_ID = "default";

export function BacklinksPanel({ pageId }: { pageId: string }) {
  const [backlinks, setBacklinks] = useState<BacklinkResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBacklinks(null);
    linksApi.getBacklinks(pageId).then((result) => {
      if (!cancelled) setBacklinks(result);
    });
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  if (!backlinks) {
    return (
      <div className="border-border border-t px-6 py-5" aria-hidden="true">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </div>
    );
  }

  if (backlinks.length === 0) return null;

  return (
    <div className="border-border border-t px-6 py-5">
      <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Link2 className="size-3.5" />
        Linked from {backlinks.length} page{backlinks.length === 1 ? "" : "s"}
      </h2>
      <ul className="mt-3 flex flex-col gap-1">
        {backlinks.map(({ link, sourcePage }) => (
          <li key={link.id}>
            <Link
              to={`/w/${WORKSPACE_ID}/p/${sourcePage.id}`}
              className="text-foreground hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <FileText className="text-brand-violet size-3.5" />
              {sourcePage.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
