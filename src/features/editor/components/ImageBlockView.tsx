import { ImageIcon, Loader2, Pencil, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface ImageBlockViewProps {
  url: string;
  alt?: string;
  caption?: string;
  onChange: (content: { url: string; alt?: string; caption?: string }) => void;
  onBackspaceEmpty: () => void;
}

// Uploaded images are stored as data URIs directly in the block's content —
// there's no real backend to upload to. IndexedDB's per-origin quota is
// generally a large fraction of free disk space (not the ~5-10MB ceiling
// localStorage had), so this cap exists to keep a single page's content
// reasonably sized in memory and on the wire, not to protect a tight quota.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

export function ImageBlockView({
  url,
  alt,
  caption,
  onChange,
  onBackspaceEmpty,
}: ImageBlockViewProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setEditing] = useState(url === "");
  const [isUploading, setUploading] = useState(false);
  const [draftUrl, setDraftUrl] = useState(url);
  const [draftAlt, setDraftAlt] = useState(alt ?? "");

  function commit(nextUrl = draftUrl, nextAlt = draftAlt) {
    if (nextUrl.trim()) {
      onChange({ url: nextUrl.trim(), alt: nextAlt.trim() || undefined, caption });
      setEditing(false);
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again after an error
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("That file isn't an image.", "error");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast(`Images must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`, "error");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDraftUrl(dataUrl);
      commit(dataUrl, draftAlt || file.name.replace(/\.[^.]+$/, ""));
    } catch {
      toast("Couldn't read that file.", "error");
    } finally {
      setUploading(false);
    }
  }

  if (isEditing) {
    return (
      <div className="border-border flex flex-col gap-3 rounded-md border border-dashed p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <ImageIcon className="size-4" />
          Add an image
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {isUploading ? "Uploading…" : "Upload a file"}
        </Button>

        <div className="text-text-faint flex items-center gap-2 text-xs">
          <div className="border-border h-px flex-1 border-t" />
          or paste a link
          <div className="border-border h-px flex-1 border-t" />
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
        <Button
          size="sm"
          className="self-start"
          onClick={() => commit()}
          disabled={!draftUrl.trim()}
        >
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
        className="aspect-video max-h-[28rem] w-full rounded-md object-contain"
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
