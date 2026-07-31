export function PageTreeSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-2 rounded-md px-3 py-2">
          <div className="bg-muted size-4 shrink-0 animate-pulse rounded" />
          <div
            className="bg-muted h-3.5 animate-pulse rounded"
            style={{ width: row === 0 ? "60%" : "40%" }}
          />
        </div>
      ))}
    </div>
  );
}
