import type { LanguageFn } from "highlight.js";

/** Languages offered in the code block picker. Each loads on demand. */
export const CODE_LANGUAGES = {
  javascript: () => import("highlight.js/lib/languages/javascript"),
  typescript: () => import("highlight.js/lib/languages/typescript"),
  json: () => import("highlight.js/lib/languages/json"),
  xml: () => import("highlight.js/lib/languages/xml"),
  css: () => import("highlight.js/lib/languages/css"),
  python: () => import("highlight.js/lib/languages/python"),
  bash: () => import("highlight.js/lib/languages/bash"),
  sql: () => import("highlight.js/lib/languages/sql"),
  markdown: () => import("highlight.js/lib/languages/markdown"),
} satisfies Record<string, () => Promise<{ default: LanguageFn }>>;

export type CodeLanguage = keyof typeof CODE_LANGUAGES;

const ALIASES: Record<string, CodeLanguage> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  html: "xml",
  sh: "bash",
  shell: "bash",
  py: "python",
  md: "markdown",
};

export function resolveCodeLanguage(name: string | undefined): CodeLanguage | null {
  const key = (name ?? "").trim().toLowerCase();
  if (key in CODE_LANGUAGES) return key as CodeLanguage;
  return ALIASES[key] ?? null;
}

const registered = new Set<CodeLanguage>();

/** Returns highlighted HTML (highlight.js escapes the source), or null for plain text. */
export async function highlightCode(
  code: string,
  name: string | undefined,
): Promise<string | null> {
  const language = resolveCodeLanguage(name);
  if (!language || code === "") return null;
  const { default: hljs } = await import("highlight.js/lib/core");
  if (!registered.has(language)) {
    const module = await CODE_LANGUAGES[language]();
    hljs.registerLanguage(language, module.default);
    registered.add(language);
  }
  return hljs.highlight(code, { language, ignoreIllegals: true }).value;
}
