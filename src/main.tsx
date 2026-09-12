import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { initDb } from "@/api/_mockDb";
import { App } from "@/App";

import "@/index.css";

// Hydrate the in-memory database from IndexedDB (or migrate a pre-existing
// localStorage copy) before the first render, so the app never briefly
// shows a fresh demo seed before swapping in the real persisted data.
initDb().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
