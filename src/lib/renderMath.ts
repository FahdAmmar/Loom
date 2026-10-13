import DOMPurify from "dompurify";

export type MathResult = { ok: true; html: string } | { ok: false; error: string };

/** KaTeX and its stylesheet load on first use, so pages without equations never pay for them. */
export async function renderMath(latex: string): Promise<MathResult> {
  const source = latex.trim();
  if (source === "") return { ok: true, html: "" };

  const [{ default: katex }] = await Promise.all([
    import("katex"),
    import("katex/dist/katex.min.css"),
  ]);
  try {
    const html = katex.renderToString(source, {
      displayMode: true,
      throwOnError: true,
      trust: false,
      output: "htmlAndMathml",
    });
    return {
      ok: true,
      html: DOMPurify.sanitize(html, { USE_PROFILES: { html: true, svg: true, mathMl: true } }),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid equation";
    return { ok: false, error: message.replace(/^KaTeX parse error:\s*/, "") };
  }
}
