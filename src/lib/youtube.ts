const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

/**
 * Extracts an 11-character YouTube video id from any of the URL shapes
 * YouTube itself produces (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`),
 * ignoring extra query params like a timestamp or share token. Returns
 * `null` for anything that isn't a recognizable YouTube video URL — this
 * both validates what was pasted and builds the iframe `src` from a
 * known-safe id, so a malformed or unrelated URL never reaches the iframe.
 */
export function extractYouTubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (host === "youtube.com") {
    if (parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }
    const embedMatch = /^\/(?:embed|shorts)\/([\w-]{11})/.exec(parsed.pathname);
    if (embedMatch) return embedMatch[1];
  }

  return null;
}

/** The privacy-enhanced embed domain — YouTube doesn't set cookies on this
 * origin until the viewer actually presses play. */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
