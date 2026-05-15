// App.jsx — top-level shell. gates on profile, then renders the tape app.
// initSync() is fire-and-forget; sync layer no-ops without env vars.

import { useEffect } from "react";
import { useStore } from "./store.js";
import { Onboarding, Shell } from "./screens/index.js";
import { initSync } from "./sync.js";
import { c } from "./theme.js";

export function App() {
  const profile = useStore((s) => s.profile);

  useEffect(() => {
    initSync();
  }, []);

  return (
    <div style={{
      maxWidth: 460,
      margin: "0 auto",
      minHeight: "100vh",
      background: c.bg,
      color: c.fg,
    }}>
      {!profile ? <Onboarding /> : <Shell />}
    </div>
  );
}
