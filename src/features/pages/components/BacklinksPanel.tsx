import { useCallback, useEffect, useState } from "react";
import { FileText, Link2, Link2Off } from "lucide-react";
import { Link } from "react-router";

import * as linksApi from "@/api/links";
import type { BacklinkResult, UnlinkedMentionResult } from "@/api/links";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

const WORKSPACE_ID = "default";

export function BacklinksPanel({ pageId }: { pageId: string }) {
  const { toast } = useToast();
  const [backlinks, setBacklinks] = useState<BacklinkResult[] | null>(null);
  const [mentions, setMentions] = useState<UnlinkedMentionResult[] | null>(null);
  const [linkingBlockId, setLinkingBlockId] = useState<string | null>(null);

  const reload = useCallback(() => {
    linksApi.getBacklinks(pageId).then(setBacklinks);
    linksApi.getUnlinkedMentions(pageId).then(setMentions);
  }, [pageId]);

  useEffect(() => {
    setBacklinks(null);
    setMentions(null);
    reload();
  }, [reload]);

  async function handleLink(mention: UnlinkedMentionResult) {
    setLinkingBlockId(mention.sourceBlockId);
    try {
      await linksApi.linkifyMention(mention.sourceBlockId, pageId);
      toast(`Linked from "${mention.sourcePage.title}".`, "success");
      reload();
    } catch {
      toast("Couldn't add that link. Try again.", "error");
    } finally {
      setLinkingBlockId(null);
    }
  }

  if (!backlinks || !mentions) {
    return (
      <div className="border-border border-t px-6 py-5" aria-hidden="true">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
      </div>
    );
  }

  if (backlinks.length === 0 && mentions.length === 0) return null;

  return (
    <div className="border-border flex flex-col gap-5 border-t px-6 py-5">
      {backlinks.length > 0 && (
        <div>
          <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Link2 className="size-3.5" />
            Linked from {backlinks.length} page{backlinks.length === 1 ? "" : "s"}
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {backlinks.map(({ link, sourcePage }) => (
              <li key={link.id}>
                <Link
                  viewTransition
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
      )}

      {mentions.length > 0 && (
        <div>
          <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <Link2Off className="size-3.5" />
            Unlinked mentions in {mentions.length} page{mentions.length === 1 ? "" : "s"}
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {mentions.map((mention) => (
              <li
                key={mention.sourceBlockId}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5"
              >
                <div className="min-w-0">
                  <Link
                    viewTransition
                    to={`/w/${WORKSPACE_ID}/p/${mention.sourcePage.id}`}
                    className="text-foreground hover:underline"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <FileText className="text-brand-violet size-3.5 shrink-0" />
                      {mention.sourcePage.title}
                    </span>
                  </Link>
                  <p className="text-text-faint truncate text-xs">{mention.snippet}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={linkingBlockId === mention.sourceBlockId}
                  onClick={() => handleLink(mention)}
                >
                  Link
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
