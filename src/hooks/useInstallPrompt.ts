import { useCallback, useEffect, useState } from "react";

/** Chromium's install event; not in the standard DOM typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Lets the app offer "Install" itself, only when the browser says it can be installed. */
export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault(); // hold it back so Settings can trigger it on request
      setPromptEvent(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setPromptEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null); // the browser only allows one prompt per event
  }, [promptEvent]);

  return { canInstall: promptEvent !== null, install };
}
