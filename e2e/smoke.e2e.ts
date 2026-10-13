import { expect, test } from "@playwright/test";

import { openApp, openPage } from "./helpers";

test("redirects to the default workspace and lists the demo pages", async ({ page }) => {
  await openApp(page);
  await expect(page).toHaveURL(/\/w\/default$/);
  await expect(page.getByRole("link", { name: "Welcome to Loom" }).first()).toBeVisible();
});

test("registers the service worker so the app works offline", async ({ page }) => {
  await openApp(page);
  // The worker passes through "installing" and "activating" first, so poll for the final state.
  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state))
    .toBe("activated");
});

test("opens the Trash screen from the sidebar", async ({ page }) => {
  await openApp(page);
  await page.getByRole("link", { name: "Trash" }).click();
  await expect(page).toHaveURL(/\/w\/default\/trash$/);
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
});

test("adds a page cover and keeps it after a reload", async ({ page }) => {
  await openApp(page);
  await openPage(page, "Ideas");
  const cover = page.locator('div[aria-hidden="true"][style*="linear-gradient"]');
  await expect(cover).toHaveCount(0);

  await page.getByRole("button", { name: "Add a cover" }).click();
  await page.getByRole("menuitem", { name: "Mint cover" }).click();
  await expect(cover).toHaveCount(1);

  // Wait for the simulated API write to persist before reloading.
  await page.waitForTimeout(500);
  await page.reload();
  await expect(cover).toHaveCount(1);

  await page.getByRole("button", { name: "Change cover" }).click();
  await page.getByRole("menuitem", { name: "Remove cover" }).click();
  await expect(cover).toHaveCount(0);
});

test("highlights code in a code block", async ({ page }) => {
  await openApp(page);
  await openPage(page, "Ideas");

  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  const newBlock = page.locator('[contenteditable="true"]').nth(1);
  await newBlock.waitFor();
  await newBlock.click();
  await page.keyboard.type("/code");
  await page.getByRole("option", { name: /code/i }).first().click();

  const code = page.getByRole("textbox", { name: "Code block" });
  await code.waitFor();
  await page.getByRole("combobox", { name: "Code language" }).selectOption("javascript");
  await code.fill('const greeting = "hello";');

  await expect(page.locator(".hljs-keyword")).toHaveText("const");
  await expect(page.locator(".hljs-string")).toHaveText('"hello"');
});

test("mirrors the layout when the Arabic language is chosen", async ({ page }) => {
  await openApp(page, "/settings");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("link", { name: "المحذوفات" })).toBeVisible();
});

test("rejects a backup file that is not a Loom export", async ({ page }) => {
  await openApp(page, "/settings");
  await page.getByLabel("Import workspace").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ formatVersion: 1, workspace: {}, pages: [], blocks: [] }),
    ),
  });
  await expect(page.getByText(/doesn't look like a Loom workspace export/)).toBeVisible();
});

test("lists open tasks from every page and lets you complete one", async ({ page }) => {
  await openApp(page);
  await page.getByRole("link", { name: "Tasks" }).click();
  const task = page.getByRole("checkbox", { name: "This one's still open" });
  await expect(task).not.toBeChecked();

  // "Open" is the default filter, so a completed item leaves the list at once.
  await task.click();
  await expect(task).toHaveCount(0);

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("checkbox", { name: "This one's still open" })).toBeChecked();
});

test("applies the chosen accent color and remembers it", async ({ page }) => {
  await openApp(page, "/settings");
  await page.getByRole("button", { name: "Violet" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-accent", "violet");
  await page.getByRole("button", { name: "Gold" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-accent", /.+/);
});

test("filters database rows by a property value", async ({ page }) => {
  await openApp(page);
  await openPage(page, "Notes");
  const table = page.getByRole("table");
  await expect(table.getByRole("link", { name: /Meeting notes/ })).toBeVisible();
  await expect(table.getByRole("link", { name: /Research notes/ })).toBeVisible();

  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByLabel("Filter field").selectOption("Status");
  await page.getByLabel("Filter value").fill("Published");

  await expect(table.getByRole("link", { name: /Research notes/ })).toBeVisible();
  await expect(table.getByRole("link", { name: /Meeting notes/ })).toHaveCount(0);

  await page.getByLabel("Filter value").fill("Nothing like this");
  await expect(page.getByText("No rows match these filters.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(table.getByRole("link", { name: /Meeting notes/ })).toBeVisible();
});

test("enlarges an image in a dialog and closes it with Escape", async ({ page }) => {
  await openApp(page);
  await openPage(page, "Project roadmap");
  await page.getByRole("button", { name: "Enlarge image" }).click();
  const dialog = page.getByRole("dialog", { name: "Q3 roadmap banner" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("groups database rows by a property", async ({ page }) => {
  await openApp(page);
  await openPage(page, "Notes");
  await page.getByLabel("Group by").selectOption("Status");
  await expect(page.getByRole("rowgroup").first()).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /Published/ })).toHaveCount(0);
  await expect(page.locator('th[scope="rowgroup"]', { hasText: "Published" })).toBeVisible();

  await page.getByLabel("Group by").selectOption("");
  await expect(page.getByText(/\d+ rows/)).toHaveCount(0);
});

test("inserts a math block and renders the equation", async ({ page }) => {
  await openApp(page);
  await openPage(page, "Ideas");

  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  const newBlock = page.locator('[contenteditable="true"]').nth(1);
  await newBlock.waitFor();
  await newBlock.click();
  await page.keyboard.type("/math");
  await page.getByRole("option", { name: /Math equation/ }).click();

  await page.getByRole("textbox", { name: "LaTeX equation" }).fill("x^2 + y^2 = z^2");
  await expect(page.locator(".katex").first()).toBeVisible();

  await page.getByRole("textbox", { name: "LaTeX equation" }).fill("\\frac{1}{");
  await expect(page.getByRole("alert")).toBeVisible();
});

test("opens a daily note from the calendar and marks the day afterwards", async ({ page }) => {
  await openApp(page);
  await page.getByRole("button", { name: "Show calendar" }).click();

  const today = new Date().toLocaleDateString("en", { dateStyle: "full" });
  const dayButton = page.getByRole("button", { name: today, exact: true });
  await dayButton.click();
  await page.waitForURL(/\/p\//);

  await expect(page.getByRole("button", { name: `${today} — has a note` })).toBeVisible();
});

test("downloads a single page as Markdown", async ({ page }) => {
  await openApp(page);
  await openPage(page, "Ideas");
  await page.locator("main").getByRole("button", { name: "More actions for Ideas" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export as Markdown" }).click();
  expect((await download).suggestedFilename()).toBe("Ideas.md");
});

test("exports every page as a ZIP and imports Markdown files back", async ({ page }) => {
  await openApp(page, "/settings");

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export all as ZIP" }).click();
  expect((await download).suggestedFilename()).toMatch(/^loom-.*\.zip$/);

  await page.getByLabel("Import Markdown files").setInputFiles({
    name: "imported.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# Imported From E2E\n\nSee [[Welcome to Loom]] for more."),
  });
  await expect(page.getByText(/Imported 1 pages/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Imported From E2E" }).first()).toBeVisible();
});

test("shows connection and storage status in Settings", async ({ page }) => {
  await openApp(page, "/settings");
  await expect(page.getByRole("heading", { name: "Storage and status" })).toBeVisible();
  await expect(page.getByText("Online", { exact: true })).toBeVisible();
  await expect(page.getByText("Never")).toBeVisible();
});
