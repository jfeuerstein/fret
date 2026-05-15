// useWakeLock.js — keep the screen on while a session is active.
// no-op in browsers without the Wake Lock API. re-acquires the lock
// when the tab becomes visible again (the OS releases it on hide).

import { useEffect } from "react";

export function useWakeLock(active) {
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        /* user denied or feature unavailable; nothing to do */
      }
    };

    acquire();

    const onVis = () => {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}
