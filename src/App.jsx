// App.jsx — top-level shell. gates on the user profile, then renders
// the full tape app. push opt-in lives inside settings for now.

import { useStore } from "./store.js";
import { TapeApp } from "./components/tape.jsx";
import { Onboarding } from "./components/screens.jsx";

const c = { bg: "#0a0a0a", fg: "#e0e0e0" };

export function App() {
  const profile = useStore((s) => s.profile);

  return (
    <div
      style={{
        maxWidth: 460,
        margin: "0 auto",
        minHeight: "100vh",
        background: c.bg,
        color: c.fg,
      }}
    >
      {!profile ? <Onboarding /> : <TapeApp />}
    </div>
  );
}
