import { extractYouTubeVideoId } from "@/lib/youtube";

/** What the editor knows about a paste at the moment it happens. */
export interface PasteData {
  text: string;
  /** The clipboard carries rich HTML (copied from a web page, Word, ...). */
  hasHtml: boolean;
  /** VS Code attaches HTML to plain-text copies; its marker tells us it's really source text. */
  isCodeEditor: boolean;
  files: File[];
  isBlockEmpty: boolean;
}

export type PasteIntent =
  | { kind: "default" }
  | { kind: "markdown"; text: string }
  | { kind: "image"; file: File }
  | { kind: "youtube"; url: string }
  | { kind: "paragraphs"; paragraphs: string[] };

// Block-level Markdown only — inline marks alone (**bold**) are too easy to false-positive on.
const BLOCK_MARKERS = [
  /^#{1,6}\s+\S/, // heading
  /^\s*[-*+]\s+\S/, // bullet or checklist
  /^\s*\d+[.)]\s+\S/, // numbered
  /^>\s?\S/, // quote
  /^\s*```/, // code fence
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/, // table separator row
];

export function looksLikeMarkdown(text: string): boolean {
  return text.split("\n").some((line) => BLOCK_MARKERS.some((pattern) => pattern.test(line)));
}

export function pickImageFile(files: readonly File[]): File | null {
  return files.find((file) => file.type.startsWith("image/")) ?? null;
}

export function classifyPaste({ text, hasHtml, isCodeEditor, files }: PasteData): PasteIntent {
  const trimmed = text.trim();
  if (!trimmed) {
    // Screenshots and copied images carry no text. Anything with text (Excel
    // cells, Word) also carries a preview image that must not win over it.
    const image = pickImageFile(files);
    return image ? { kind: "image", file: image } : { kind: "default" };
  }

  // A lone video URL becomes an embed whether or not the browser also attached HTML.
  if (!/\s/.test(trimmed) && extractYouTubeVideoId(trimmed)) {
    return { kind: "youtube", url: trimmed };
  }

  // Rich clipboard content keeps the editor's own HTML handling.
  if (hasHtml && !isCodeEditor) return { kind: "default" };

  if (looksLikeMarkdown(trimmed)) return { kind: "markdown", text: trimmed };

  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim());
  if (paragraphs.length > 1) return { kind: "paragraphs", paragraphs };

  return { kind: "default" };
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
