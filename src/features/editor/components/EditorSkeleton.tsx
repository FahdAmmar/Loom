export function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-6 py-6" aria-hidden="true">
      <div className="bg-muted h-7 w-2/5 animate-pulse rounded" />
      <div className="bg-muted h-4 w-full animate-pulse rounded" />
      <div className="bg-muted h-4 w-5/6 animate-pulse rounded" />
      <div className="bg-muted mt-2 h-4 w-3/4 animate-pulse rounded" />
    </div>
  );
}
