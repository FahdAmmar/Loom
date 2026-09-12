import { Pencil, PlaySquare } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { extractYouTubeVideoId, youtubeEmbedUrl } from "@/lib/youtube";

interface EmbedBlockViewProps {
  url: string;
  onChange: (content: { url: string }) => void;
  onBackspaceEmpty: () => void;
}

export function EmbedBlockView({ url, onChange, onBackspaceEmpty }: EmbedBlockViewProps) {
  const [isEditing, setEditing] = useState(url === "");
  const [draftUrl, setDraftUrl] = useState(url);
  const videoId = extractYouTubeVideoId(url);
  const draftIsInvalid = draftUrl.trim() !== "" && extractYouTubeVideoId(draftUrl) === null;

  function commit() {
    const id = extractYouTubeVideoId(draftUrl);
    if (id) {
      onChange({ url: draftUrl.trim() });
      setEditing(false);
    }
  }

  if (isEditing) {
    return (
      <div className="border-border flex flex-col gap-3 rounded-md border border-dashed p-4">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <PlaySquare className="size-4" />
          Embed a YouTube video
        </div>

        <input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Backspace" && draftUrl === "") onBackspaceEmpty();
          }}
          placeholder="https://www.youtube.com/watch?v=…"
          aria-invalid={draftIsInvalid}
          className="border-border focus-visible:border-ring aria-invalid:border-destructive rounded-md border bg-transparent px-2.5 py-1.5 text-sm outline-none"
        />
        {draftIsInvalid && (
          <p className="text-destructive text-xs">Couldn't recognize that as a YouTube link.</p>
        )}
        <Button size="sm" className="self-start" onClick={commit} disabled={!draftUrl.trim()}>
          Embed video
        </Button>
      </div>
    );
  }

  return (
    <figure className="group relative">
      {videoId ? (
        <iframe
          src={youtubeEmbedUrl(videoId)}
          title="Embedded YouTube video"
          className="aspect-video w-full rounded-md"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          // Scoped to exactly what the YouTube player needs: its own
          // scripts, its own origin's storage (both required for
          // playback), and popups (the player's own "Share"/"Watch on
          // YouTube" links). No allow-forms, no allow-top-navigation.
          // allow-scripts + allow-same-origin together would let a
          // same-origin src escape its sandbox — not a risk here, since
          // youtubeEmbedUrl always points at youtube-nocookie.com, never
          // this app's own origin.
          // oxlint-disable-next-line react/iframe-missing-sandbox
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        />
      ) : (
        <div className="border-border bg-muted text-muted-foreground flex aspect-video w-full items-center justify-center rounded-md border border-dashed text-sm">
          Couldn't recognize that as a YouTube link.
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setDraftUrl(url);
          setEditing(true);
        }}
        aria-label="Edit embed"
        className="bg-background/90 text-muted-foreground absolute top-2 right-2 flex size-8 items-center justify-center rounded-md opacity-0 group-hover:opacity-100"
      >
        <Pencil className="size-3.5" />
      </button>
    </figure>
  );
}
