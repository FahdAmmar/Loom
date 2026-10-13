import { expect, type Page } from "@playwright/test";

/** Opens the app and dismisses the first-visit tour. */
export async function openApp(page: Page, path = "/") {
  await page.goto(path);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
}

export async function openPage(page: Page, title: string) {
  await page.getByRole("link", { name: title, exact: true }).first().click();
  await page.waitForURL(/\/p\//);
}
