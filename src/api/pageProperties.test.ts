import { beforeEach, describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";
import * as propertiesApi from "@/api/pageProperties";

const PAGE_ID = "test-page";

beforeEach(() => {});

describe("addProperty — select options", () => {
  it("stores a cleaned option list on a select property", async () => {
    const property = await propertiesApi.addProperty(PAGE_ID, "Priority", "select", [
      " Low ",
      "High",
      "low",
    ]);
    expect(property.options).toEqual(["Low", "High"]);
  });

  it("leaves options unset when none are given, so the shared preset applies", async () => {
    const property = await propertiesApi.addProperty(PAGE_ID, "Status", "select");
    expect(property.options).toBeUndefined();
  });

  it("ignores options on a property that isn't a select", async () => {
    const property = await propertiesApi.addProperty(PAGE_ID, "Notes", "text", ["a", "b"]);
    expect(property.options).toBeUndefined();
  });
});

describe("updatePropertyOptions", () => {
  it("replaces the options and keeps the current value", async () => {
    const property = await propertiesApi.addProperty(PAGE_ID, "Priority", "select", ["Low"]);
    await propertiesApi.updatePropertyValue(property.id, "Low");

    const updated = await propertiesApi.updatePropertyOptions(property.id, ["Urgent", "Later"]);

    expect(updated.options).toEqual(["Urgent", "Later"]);
    expect(updated.value).toBe("Low");
    const [stored] = await propertiesApi.getPropertiesForPage(PAGE_ID);
    expect(stored.options).toEqual(["Urgent", "Later"]);
  });

  it("reverts to the shared preset when given an empty list", async () => {
    const property = await propertiesApi.addProperty(PAGE_ID, "Priority", "select", ["Low"]);

    const updated = await propertiesApi.updatePropertyOptions(property.id, ["  ", ""]);

    expect(updated.options).toBeUndefined();
  });

  it("rejects a property that isn't a select", async () => {
    const property = await propertiesApi.addProperty(PAGE_ID, "Notes", "text");
    await expect(propertiesApi.updatePropertyOptions(property.id, ["a"])).rejects.toMatchObject(
      {
        status: 400,
      },
    );
  });

  it("throws an ApiError for an unknown property id", async () => {
    await expect(propertiesApi.updatePropertyOptions("nope", ["a"])).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
