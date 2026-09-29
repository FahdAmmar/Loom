import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import { parseOptionList } from "@/lib/properties";
import type { PageProperty, PagePropertyType } from "@/types/entities";

export async function getPropertiesForPage(pageId: string): Promise<PageProperty[]> {
  await networkDelay(100);
  return Object.values(mockDb.read().pageProperties).filter((p) => p.pageId === pageId);
}

/** Properties for many pages in one round trip — used by database-view
 * blocks, which would otherwise need one call per row (N+1). */
export async function getPropertiesForPages(pageIds: string[]): Promise<PageProperty[]> {
  await networkDelay(120);
  const idSet = new Set(pageIds);
  return Object.values(mockDb.read().pageProperties).filter((p) => idSet.has(p.pageId));
}

export async function addProperty(
  pageId: string,
  key: string,
  type: PagePropertyType,
  options?: string[],
): Promise<PageProperty> {
  await networkDelay(100);
  const db = mockDb.read();
  const trimmed = key.trim();
  if (!trimmed) throw new ApiError("A property needs a name.");

  const property: PageProperty = {
    id: `prop-${crypto.randomUUID()}`,
    pageId,
    key: trimmed,
    type,
    value: type === "checkbox" ? false : null,
  };
  // Only a select has choices; an empty list means "use the shared preset".
  if (type === "select" && options?.length)
    property.options = parseOptionList(options.join(","));
  db.pageProperties[property.id] = property;
  mockDb.write(db);
  return property;
}

/** Creates the same new property (empty value) on every page in `pageIds`
 * at once — used when a database-view table adds a new column, so it's
 * immediately available to fill in on every existing row rather than
 * needing to be created one row at a time. */
export async function addPropertyToPages(
  pageIds: string[],
  key: string,
  type: PagePropertyType,
): Promise<PageProperty[]> {
  await networkDelay(120);
  const trimmed = key.trim();
  if (!trimmed) throw new ApiError("A property needs a name.");

  const db = mockDb.read();
  const created: PageProperty[] = pageIds.map((pageId) => ({
    id: `prop-${crypto.randomUUID()}`,
    pageId,
    key: trimmed,
    type,
    value: type === "checkbox" ? false : null,
  }));
  for (const property of created) db.pageProperties[property.id] = property;
  mockDb.write(db);
  return created;
}

export async function updatePropertyValue(
  id: string,
  value: PageProperty["value"],
): Promise<PageProperty> {
  await networkDelay(90);
  const db = mockDb.read();
  const existing = db.pageProperties[id];
  if (!existing) throw new ApiError(`No property found with id "${id}".`, 404);

  const updated: PageProperty = { ...existing, value };
  db.pageProperties[id] = updated;
  mockDb.write(db);
  return updated;
}

/** Replaces a select property's choices. An empty list reverts it to the shared preset; its current value is left untouched either way. */
export async function updatePropertyOptions(
  id: string,
  options: string[],
): Promise<PageProperty> {
  await networkDelay(90);
  const db = mockDb.read();
  const existing = db.pageProperties[id];
  if (!existing) throw new ApiError(`No property found with id "${id}".`, 404);
  if (existing.type !== "select")
    throw new ApiError("Only select properties have options.", 400);

  const cleaned = parseOptionList(options.join(","));
  const { options: _previous, ...rest } = existing;
  const updated: PageProperty = cleaned.length ? { ...rest, options: cleaned } : rest;
  db.pageProperties[id] = updated;
  mockDb.write(db);
  return updated;
}

export async function deleteProperty(id: string): Promise<void> {
  await networkDelay();
  const db = mockDb.read();
  delete db.pageProperties[id];
  mockDb.write(db);
}
