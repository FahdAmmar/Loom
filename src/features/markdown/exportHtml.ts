import DOMPurify from "dompurify";
import { marked } from "marked";

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const PAGE_STYLE = `
:root{color-scheme:light dark;--bg:#f5f3ee;--fg:#1c1c28;--muted:#6d6e7b;--line:#d9d6cc;--code:#ebe8df}
@media(prefers-color-scheme:dark){:root{--bg:#12131c;--fg:#edeef2;--muted:#9a9bb0;--line:#2c2f48;--code:#21243a}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.7 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:46rem;margin:0 auto;padding:3rem 1.25rem}
h1,h2,h3{line-height:1.25}
a{color:inherit}
blockquote{margin:1rem 0;padding-inline-start:1rem;border-inline-start:3px solid var(--line);color:var(--muted)}
pre,code{background:var(--code);border-radius:6px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em}
code{padding:.1em .35em}
pre{padding:.9rem 1rem;overflow-x:auto}
pre code{padding:0;background:none}
table{border-collapse:collapse;width:100%;margin:1rem 0}
th,td{border:1px solid var(--line);padding:.4rem .6rem;text-align:start}
img{max-width:100%;height:auto}
hr{border:0;border-top:1px solid var(--line)}
@media print{body{background:#fff;color:#000}}
`;

/** Standalone, self-contained HTML page. The body is sanitized because page text is untrusted. */
export function markdownToHtmlDocument(
  title: string,
  markdown: string,
  options: { dir: "ltr" | "rtl" },
): string {
  const rendered = marked.parse(markdown, { async: false, gfm: true });
  const body = DOMPurify.sanitize(rendered, { USE_PROFILES: { html: true } });
  const lang = options.dir === "rtl" ? "ar" : "en";
  return `<!doctype html>
<html lang="${lang}" dir="${options.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeText(title)}</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}
