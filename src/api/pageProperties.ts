import { ApiError } from "@/api/client";
import { mockDb, networkDelay } from "@/api/_mockDb";
import type { PageProperty, PagePropertyType } from "@/types/entities";

export async function getPropertiesForPage(pageId: string): Promise<PageProperty[]> {
  await networkDelay(100);
  return Object.values(mockDb.read().pageProperties).filter((p) => p.pageId === pageId);
}

export async function addProperty(
  pageId: string,
  key: string,
  type: PagePropertyType,
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
  db.pageProperties[property.id] = property;
  mockDb.write(db);
  return property;
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

export async function deleteProperty(id: string): Promise<void> {
  await networkDelay();
  const db = mockDb.read();
  delete db.pageProperties[id];
  mockDb.write(db);
}
