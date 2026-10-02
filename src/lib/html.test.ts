import { describe, expect, it } from "vitest";

import { parseHtmlFragment, sanitizeRichText } from "@/lib/html";

describe("sanitizeRichText", () => {
  it("keeps editor marks and wikilink chips", () => {
    const html =
      '<strong>a</strong> <mark data-color="gold">b</mark> <span data-page-link="" data-page-id="p1" class="page-link-chip">c</span>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("strips scripts, event handlers and unknown tags", () => {
    const out = sanitizeRichText(
      '<img src=x onerror="alert(1)"><script>alert(1)</script><b onclick="x()">ok</b>',
    );
    expect(out).toBe("<b>ok</b>");
  });
});

describe("parseHtmlFragment", () => {
  it("does not fire handlers while parsing", () => {
    let fired = false;
    (window as unknown as { xssProbe: () => void }).xssProbe = () => {
      fired = true;
    };
    const body = parseHtmlFragment('<img src="x" onerror="window.xssProbe()">text');
    expect(body.textContent).toBe("text");
    expect(fired).toBe(false);
  });
});
