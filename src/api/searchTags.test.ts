import { beforeEach, describe, expect, it } from "vitest";

import * as pagesApi from "@/api/pages";
import { search } from "@/api/search";
import * as tagsApi from "@/api/tags";

const WS = "default";

beforeEach(() => {});

async function taggedPage(title: string, tagName: string) {
  const page = await pagesApi.createPage({ workspaceId: WS, parentId: null, title });
  const tag = await tagsApi.createTag(WS, tagName);
  await tagsApi.setPageTags(page.id, [tag.id]);
  return page;
}

describe("search — tags", () => {
  it("surfaces a page whose tag matches the query, reporting which tag", async () => {
    const page = await taggedPage("Untitled thing", "zebrafish");

    const results = await search("zebra");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      page: { id: page.id },
      matchType: "tag",
      tagName: "zebrafish",
    });
  });

  it("treats a leading # as 'this is a tag'", async () => {
    const page = await taggedPage("Untitled thing", "zebrafish");

    const results = await search("#zebrafish");

    expect(results.map((r) => r.page.id)).toEqual([page.id]);
  });

  it("does not match every tagged page for a bare #", async () => {
    await taggedPage("Untitled thing", "zebrafish");

    // Seeded demo content may contain a literal "#" (e.g. a hex colour), so
    // assert on tag matches specifically rather than on an empty result.
    const results = await search("#");
    expect(results.filter((r) => r.matchType === "tag")).toEqual([]);
  });

  it("reports one result per page, preferring the title match over the tag", async () => {
    await taggedPage("Zebrafish notes", "zebrafish");

    const results = await search("zebrafish");

    expect(results).toHaveLength(1);
    expect(results[0].matchType).toBe("title");
  });

  it("lists title matches ahead of tag matches", async () => {
    await taggedPage("Aardvark", "quokka-tag");
    await pagesApi.createPage({ workspaceId: WS, parentId: null, title: "Quokka facts" });

    const results = await search("quokka");

    expect(results.map((r) => r.matchType)).toEqual(["title", "tag"]);
  });

  it("finds nothing for a query no tag or page matches", async () => {
    await taggedPage("Untitled thing", "zebrafish");

    expect(await search("no-such-thing-xyz")).toEqual([]);
  });
});
