import { FileText, Loader2, Paperclip, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

interface FileBlockViewProps {
  url: string;
  name?: string;
  size?: number;
  onChange: (content: { url: string; name?: string; size?: number }) => void;
  onBackspaceEmpty: () => void;
}

// Same reasoning as ImageBlockView's cap — a data URI lives directly in
// the block's content, sharing localStorage's shared ~5MB-per-origin quota
// across every page, so one attachment can't be allowed to eat most of it.
const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileBlockView({
  url,
  name,
  size,
  onChange,
  onBackspaceEmpty,
}: FileBlockViewProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setUploading] = useState(false);

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again after an error
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast(`Files must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.`, "error");
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange({ url: dataUrl, name: file.name, size: file.size });
    } catch {
      toast("Couldn't read that file.", "error");
    } finally {
      setUploading(false);
    }
  }

  if (!url) {
    return (
      <div className="border-border flex flex-col gap-3 rounded-md border border-dashed p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Paperclip className="size-4" />
          Attach a file
        </div>

        <input
          ref={fileInputRef}
          type="file"
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
          onKeyDown={(e) => {
            if (e.key === "Backspace") onBackspaceEmpty();
          }}
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {isUploading ? "Uploading…" : "Upload a file"}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-muted/40 group flex items-center gap-3 rounded-md border p-3">
      <FileText className="text-muted-foreground size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <a
          href={url}
          download={name}
          className="text-foreground block truncate text-sm font-medium hover:underline"
        >
          {name || "Untitled file"}
        </a>
        {typeof size === "number" && (
          <p className="text-text-faint text-xs">{formatBytes(size)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange({ url: "", name: undefined, size: undefined })}
        aria-label="Remove attachment"
        className="text-muted-foreground hover:bg-accent flex size-7 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
