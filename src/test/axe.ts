import axe from "axe-core";
import { expect } from "vitest";

/**
 * Fails with a readable list of WCAG violations. Color contrast is skipped
 * because jsdom has no layout or computed styles; check it in the browser.
 */
export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} -> ${violation.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary).toEqual([]);
}
