import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { EditorSkeleton } from "@/features/editor/components/EditorSkeleton";
import { AppShell } from "@/layouts/AppShell";
import { NotFoundRoute } from "@/routes/NotFoundRoute";
import { PageRoute } from "@/routes/PageRoute";
import { WorkspaceRoute } from "@/routes/WorkspaceRoute";

// Secondary screens load on demand to keep the first bundle small.
const GraphRoute = lazy(() =>
  import("@/routes/GraphRoute").then((m) => ({ default: m.GraphRoute })),
);
const SettingsRoute = lazy(() =>
  import("@/routes/SettingsRoute").then((m) => ({ default: m.SettingsRoute })),
);
const TasksRoute = lazy(() =>
  import("@/routes/TasksRoute").then((m) => ({ default: m.TasksRoute })),
);
const TagsRoute = lazy(() =>
  import("@/routes/TagsRoute").then((m) => ({ default: m.TagsRoute })),
);
const TemplatesRoute = lazy(() =>
  import("@/routes/TemplatesRoute").then((m) => ({ default: m.TemplatesRoute })),
);
const TrashRoute = lazy(() =>
  import("@/routes/TrashRoute").then((m) => ({ default: m.TrashRoute })),
);

const DEFAULT_WORKSPACE = "default";

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<EditorSkeleton />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to={`/w/${DEFAULT_WORKSPACE}`} replace />} />
            <Route path="/w/:workspaceId" element={<WorkspaceRoute />} />
            <Route path="/w/:workspaceId/p/:pageId" element={<PageRoute />} />
            <Route path="/w/:workspaceId/graph" element={<GraphRoute />} />
            <Route path="/w/:workspaceId/tasks" element={<TasksRoute />} />
            <Route path="/w/:workspaceId/tags/:tagId?" element={<TagsRoute />} />
            <Route path="/w/:workspaceId/templates" element={<TemplatesRoute />} />
            <Route path="/w/:workspaceId/trash" element={<TrashRoute />} />
            <Route path="/settings/:tab?" element={<SettingsRoute />} />
            <Route path="*" element={<NotFoundRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
