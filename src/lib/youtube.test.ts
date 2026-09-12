import { describe, expect, it } from "vitest";

import { extractYouTubeVideoId, youtubeEmbedUrl } from "@/lib/youtube";

describe("extractYouTubeVideoId", () => {
  it("extracts the id from a standard watch URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts the id from a youtu.be short link", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts the id from an already-embed URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts the id from a Shorts URL", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("ignores extra query params like a timestamp", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("ignores a share token appended after a youtu.be id", () => {
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?si=abc123")).toBe("dQw4w9WgXcQ");
  });

  it("handles the m.youtube.com mobile host", () => {
    expect(extractYouTubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("returns null for a non-YouTube URL", () => {
    expect(extractYouTubeVideoId("https://vimeo.com/12345")).toBeNull();
  });

  it("returns null for a YouTube URL with no video id", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/")).toBeNull();
  });

  it("returns null for a malformed URL", () => {
    expect(extractYouTubeVideoId("not a url")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractYouTubeVideoId("")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("builds a privacy-enhanced embed URL from a video id", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
});
