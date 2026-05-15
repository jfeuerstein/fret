// more.jsx — overflow nav. holds the less-frequent screens behind one tab
// so the bottom bar stays uncrowded on phones.

import { useState } from "react";
import { Header } from "../components/atoms.jsx";
import { baseFont, c, screenStyle } from "../theme.js";
import { JournalScreen } from "./journal.jsx";
import { LibraryScreen } from "./library.jsx";
import { SettingsScreen } from "./settings.jsx";
import { TunerScreen } from "./tuner.jsx";

const TILES = [
  { id: "tuner",    label: "tuner",    sub: "pitch + cents", icon: "◊" },
  { id: "library",  label: "library",  sub: "chords · tabs · backing", icon: "≡" },
  { id: "journal",  label: "journal",  sub: "what clicked", icon: "✎" },
  { id: "settings", label: "settings", sub: "push · sync · reset", icon: "⚙" },
];

export function MoreScreen() {
  const [open, setOpen] = useState(null);

  if (open === "tuner")    return <SubScreen onBack={() => setOpen(null)}><TunerScreen /></SubScreen>;
  if (open === "library")  return <SubScreen onBack={() => setOpen(null)}><LibraryScreen /></SubScreen>;
  if (open === "journal")  return <SubScreen onBack={() => setOpen(null)}><JournalScreen /></SubScreen>;
  if (open === "settings") return <SubScreen onBack={() => setOpen(null)}><SettingsScreen /></SubScreen>;

  return (
    <div style={screenStyle}>
      <Header left="MORE" right="TOOLS" />
      <div style={{ fontSize: 22, marginBottom: 18 }}>more</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {TILES.map((t) => (
          <button
            key={t.id}
            onClick={() => setOpen(t.id)}
            style={{
              background: c.panel,
              color: c.fg,
              border: `1px solid ${c.border}`,
              padding: "20px 16px",
              textAlign: "left",
              cursor: "pointer",
              font: "inherit",
              fontFamily: baseFont,
              minHeight: 110,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 24, color: c.amber }}>{t.icon}</div>
            <div>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{t.label}</div>
              <div style={{ color: c.muted, fontSize: 11, letterSpacing: 0.5 }}>
                {t.sub}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubScreen({ children, onBack }) {
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={onBack}
        style={{
          position: "fixed",
          top: "calc(env(safe-area-inset-top, 0px) + 14px)",
          right: 16,
          zIndex: 40,
          background: c.bg,
          color: c.fg,
          border: `1px solid ${c.border}`,
          padding: "8px 12px",
          font: "inherit",
          fontFamily: baseFont,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        ← more
      </button>
      {children}
    </div>
  );
}
