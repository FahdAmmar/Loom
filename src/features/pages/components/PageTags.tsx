import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import * as tagsApi from "@/api/tags";
import { cn } from "@/lib/utils";
import { useTagStore } from "@/stores/useTagStore";
import type { Tag } from "@/types/entities";
import { TAG_COLOR_CLASSES } from "@/lib/tagColors";

const WORKSPACE_ID = "default";

export function PageTags({ pageId }: { pageId: string }) {
  const tagsById = useTagStore((s) => s.tagsById);
  const createTag = useTagStore((s) => s.createTag);

  const [pageTagIds, setPageTagIds] = useState<string[]>([]);
  const [isPicking, setPicking] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    tagsApi.getTagsForPage(pageId).then((tags) => {
      if (!cancelled) setPageTagIds(tags.map((t) => t.id));
    });
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  async function persist(nextIds: string[]) {
    setPageTagIds(nextIds);
    await tagsApi.setPageTags(pageId, nextIds);
  }

  function removeTag(tagId: string) {
    persist(pageTagIds.filter((id) => id !== tagId));
  }

  async function addExisting(tagId: string) {
    setQuery("");
    if (!pageTagIds.includes(tagId)) await persist([...pageTagIds, tagId]);
  }

  async function createAndAdd() {
    const trimmed = query.trim();
    if (!trimmed) return;
    const tag = await createTag(WORKSPACE_ID, trimmed);
    setQuery("");
    await persist([...pageTagIds, tag.id]);
  }

  const currentTags = pageTagIds.map((id) => tagsById[id]).filter((t): t is Tag => Boolean(t));
  const trimmedQuery = query.trim().toLowerCase();
  const suggestions = Object.values(tagsById).filter(
    (t) =>
      !pageTagIds.includes(t.id) &&
      (!trimmedQuery || t.name.toLowerCase().includes(trimmedQuery)),
  );
  const hasExactMatch = suggestions.some((t) => t.name.toLowerCase() === trimmedQuery);

  return (
    <div
      className="relative mt-2 flex flex-wrap items-center gap-1.5"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPicking(false);
          setQuery("");
        }
      }}
    >
      {currentTags.map((tag) => (
        <span
          key={tag.id}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            TAG_COLOR_CLASSES[tag.color],
          )}
        >
          {tag.name}
          <button
            type="button"
            onClick={() => removeTag(tag.id)}
            aria-label={`Remove ${tag.name}`}
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={() => setPicking((v) => !v)}
        className="text-text-faint hover:bg-accent hover:text-accent-foreground border-border flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs"
      >
        <Plus className="size-3" />
        Tag
      </button>

      {isPicking && (
        <div className="border-border bg-popover text-popover-foreground absolute top-full left-0 z-20 mt-1 w-56 rounded-md border p-1.5 shadow-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (suggestions[0]) addExisting(suggestions[0].id);
                else if (!hasExactMatch) createAndAdd();
              }
              if (e.key === "Escape") setPicking(false);
            }}
            placeholder="Find or create a tag…"
            aria-label="Find or create a tag"
            className="border-border mb-1 w-full rounded border bg-transparent px-2 py-1 text-sm outline-none"
          />
          <div className="max-h-40 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addExisting(tag.id)}
                className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
              >
                <span className={cn("size-2 rounded-full", TAG_COLOR_CLASSES[tag.color])} />
                {tag.name}
              </button>
            ))}
            {trimmedQuery && !hasExactMatch && (
              <button
                type="button"
                onClick={createAndAdd}
                className="hover:bg-accent text-muted-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
              >
                <Plus className="size-3.5" />
                Create "{query.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
