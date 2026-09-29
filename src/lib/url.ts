const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * Turns what someone typed into a link field into a safe href, or `null`
 * if it isn't one. A bare "example.com" gets `https://`; anything with
 * another scheme (`javascript:`, `data:`, ...) is rejected outright — the
 * value ends up in an `<a href>` inside stored HTML, so this is the one
 * place that decides what's allowed there.
 */
export function normalizeLinkUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  try {
    const url = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
