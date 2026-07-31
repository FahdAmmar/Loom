import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AppShell } from "@/layouts/AppShell";
import { GraphRoute } from "@/routes/GraphRoute";
import { NotFoundRoute } from "@/routes/NotFoundRoute";
import { PageRoute } from "@/routes/PageRoute";
import { SettingsRoute } from "@/routes/SettingsRoute";
import { TagsRoute } from "@/routes/TagsRoute";
import { TemplatesRoute } from "@/routes/TemplatesRoute";
import { WorkspaceRoute } from "@/routes/WorkspaceRoute";

const DEFAULT_WORKSPACE = "default";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to={`/w/${DEFAULT_WORKSPACE}`} replace />} />
          <Route path="/w/:workspaceId" element={<WorkspaceRoute />} />
          <Route path="/w/:workspaceId/p/:pageId" element={<PageRoute />} />
          <Route path="/w/:workspaceId/graph" element={<GraphRoute />} />
          <Route path="/w/:workspaceId/tags/:tagId?" element={<TagsRoute />} />
          <Route path="/w/:workspaceId/templates" element={<TemplatesRoute />} />
          <Route path="/settings/:tab?" element={<SettingsRoute />} />
          <Route path="*" element={<NotFoundRoute />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
