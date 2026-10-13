import { useEffect, useState } from "react";

export interface StorageEstimate {
  usage: number;
  quota: number;
}

/** Null while loading or when the browser can't report storage use. */
export function useStorageEstimate(): StorageEstimate | null {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    let cancelled = false;
    navigator.storage
      ?.estimate?.()
      .then(({ usage, quota }) => {
        if (!cancelled && usage !== undefined && quota) setEstimate({ usage, quota });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return estimate;
}
