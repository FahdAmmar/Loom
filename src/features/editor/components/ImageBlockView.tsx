import { ImageIcon, Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface ImageBlockViewProps {
  url: string;
  alt?: string;
  caption?: string;
  onChange: (content: { url: string; alt?: string; caption?: string }) => void;
  onBackspaceEmpty: () => void;
}

export function ImageBlockView({
  url,
  alt,
  caption,
  onChange,
  onBackspaceEmpty,
}: ImageBlockViewProps) {
  const [isEditing, setEditing] = useState(url === "");
  const [draftUrl, setDraftUrl] = useState(url);
  const [draftAlt, setDraftAlt] = useState(alt ?? "");

  function commit() {
    if (draftUrl.trim()) {
      onChange({ url: draftUrl.trim(), alt: draftAlt.trim() || undefined, caption });
      setEditing(false);
    }
  }

  if (isEditing) {
    return (
      <div className="border-border flex flex-col gap-2 rounded-md border border-dashed p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <ImageIcon className="size-4" />
          Add an image by URL
        </div>
        <input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Backspace" && draftUrl === "") onBackspaceEmpty();
          }}
          placeholder="https://example.com/image.png"
          className="border-border focus-visible:border-ring rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none"
        />
        <input
          value={draftAlt}
          onChange={(e) => setDraftAlt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder="Alt text (for screen readers)"
          className="border-border focus-visible:border-ring rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none"
        />
        <Button size="sm" className="self-start" onClick={commit} disabled={!draftUrl.trim()}>
          Add image
        </Button>
      </div>
    );
  }

  return (
    <figure className="group relative">
      <img
        src={url}
        alt={alt ?? ""}
        className="max-h-[28rem] w-full rounded-md object-contain"
      />
      <button
        type="button"
        onClick={() => {
          setDraftUrl(url);
          setDraftAlt(alt ?? "");
          setEditing(true);
        }}
        aria-label="Edit image"
        className="bg-background/90 text-muted-foreground absolute top-2 right-2 flex size-8 items-center justify-center rounded-md opacity-0 group-hover:opacity-100"
      >
        <Pencil className="size-3.5" />
      </button>
      {caption && (
        <figcaption className="text-text-faint mt-1.5 text-center text-sm">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
