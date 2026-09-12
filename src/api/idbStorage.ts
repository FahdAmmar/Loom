/**
 * A tiny promise-based wrapper around the native IndexedDB API, scoped to
 * exactly what `_mockDb.ts` needs: get/set/delete one JSON-serializable
 * value by key. No external dependency (e.g. the `idb` package) — three
 * promisified calls around the native callback API is small enough to hand
 * -roll, the same judgment call this codebase already makes elsewhere for
 * similarly contained browser APIs.
 */

const DB_NAME = "loom-db";
const DB_VERSION = 1;
const STORE_NAME = "kv";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = run(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  return withStore("readonly", (store) => store.get(key));
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  await withStore("readwrite", (store) => store.put(value, key));
}

export async function idbDelete(key: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(key));
}
