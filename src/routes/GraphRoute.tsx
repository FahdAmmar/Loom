import { lazy, Suspense } from "react";

const GraphView = lazy(() =>
  import("@/features/graph/components/GraphView").then((m) => ({ default: m.GraphView })),
);

export function GraphRoute() {
  return (
    <div className="h-full w-full">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
            <div className="bg-muted size-16 animate-pulse rounded-full" />
          </div>
        }
      >
        <GraphView />
      </Suspense>
    </div>
  );
}
