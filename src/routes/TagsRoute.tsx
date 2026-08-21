import { useEffect, useState } from "react";
import { FileText, Tag as TagIcon } from "lucide-react";
import { Link, useParams } from "react-router";

import * as tagsApi from "@/api/tags";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useTagStore } from "@/stores/useTagStore";
import type { Page } from "@/types/entities";
import { TAG_COLOR_CLASSES } from "@/lib/tagColors";

const WORKSPACE_ID = "default";

function TagGallery() {
  const tagsById = useTagStore((s) => s.tagsById);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    tagsApi.getTagCounts(WORKSPACE_ID).then(setCounts);
  }, []);

  const tags = Object.values(tagsById);

  if (tags.length === 0) {
    return (
      <EmptyState
        icon={<TagIcon className="size-5" />}
        title="No tags yet"
        description="Add a tag to any page from its header, and it'll show up here."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-xl font-semibold">Tags</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every tag in this workspace, and how many pages use it.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            viewTransition
            key={tag.id}
            to={`/w/${WORKSPACE_ID}/tags/${tag.id}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
              TAG_COLOR_CLASSES[tag.color],
            )}
          >
            {tag.name}
            <span className="text-xs opacity-70">{counts[tag.id] ?? 0}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TagPages({ tagId }: { tagId: string }) {
  const tagsById = useTagStore((s) => s.tagsById);
  const [pages, setPages] = useState<Page[] | null>(null);
  const tag = tagsById[tagId];

  useEffect(() => {
    setPages(null);
    tagsApi.getPagesForTag(tagId).then(setPages);
  }, [tagId]);

  if (!tag) {
    return (
      <EmptyState
        icon={<TagIcon className="size-5" />}
        title="This tag doesn't exist"
        description="It may have been deleted."
        action={
          <Link
            viewTransition
            to={`/w/${WORKSPACE_ID}/tags`}
            className="text-primary mt-2 text-sm font-medium hover:underline"
          >
            Back to tags
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        viewTransition
        to={`/w/${WORKSPACE_ID}/tags`}
        className="text-muted-foreground text-sm hover:underline"
      >
        ← All tags
      </Link>
      <h1 className="mt-2 flex items-center gap-2 text-xl font-semibold">
        <span className={cn("rounded-full px-3 py-1 text-base", TAG_COLOR_CLASSES[tag.color])}>
          {tag.name}
        </span>
      </h1>

      {pages === null ? (
        <div className="mt-6 flex flex-col gap-2" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="bg-muted h-9 animate-pulse rounded-md" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">No pages have this tag yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-1">
          {pages.map((page) => (
            <li key={page.id}>
              <Link
                viewTransition
                to={`/w/${WORKSPACE_ID}/p/${page.id}`}
                className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm"
              >
                <FileText className="text-muted-foreground size-4 shrink-0" />
                {page.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TagsRoute() {
  const { tagId } = useParams();
  return tagId ? <TagPages tagId={tagId} /> : <TagGallery />;
}
