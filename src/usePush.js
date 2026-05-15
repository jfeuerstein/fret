// usePush.js — subscribe to web push, persist sub to server.
// usage: const { supported, subscription, subscribe, unsubscribe } = usePush();
//
// also exports markPracticed() — call from the session screen when the
// user finishes a tape so the cron can skip them today.

import { useCallback, useEffect, useState } from "react";
import { Store } from "./store.js";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function markPracticed() {
  const sub = Store.get().pushSubscription;
  if (!sub?.endpoint) return;
  try {
    await fetch("/api/practiced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    /* network errors are fine — cron will just nudge them tomorrow */
  }
}

export function usePush() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const [perm, setPerm] = useState(supported ? Notification.permission : "denied");
  const [sub, setSub] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((s) => setSub(s))
      .catch((e) => setError(e.message));
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) throw new Error("push_unsupported");
    if (!VAPID_PUBLIC_KEY) throw new Error("missing VITE_VAPID_PUBLIC_KEY");

    const result = await Notification.requestPermission();
    setPerm(result);
    if (result !== "granted") throw new Error("permission_denied");

    const reg = await navigator.serviceWorker.ready;
    const newSub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: newSub.toJSON(),
        clientId: Store.get().clientId,
      }),
    });

    Store.setPushSubscription(newSub.toJSON());
    setSub(newSub);
    return newSub;
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!sub) return;
    await sub.unsubscribe();
    await fetch("/api/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    Store.setPushSubscription(null);
    setSub(null);
  }, [sub]);

  return {
    supported,
    permission: perm,
    subscription: sub,
    subscribe,
    unsubscribe,
    error,
  };
}
