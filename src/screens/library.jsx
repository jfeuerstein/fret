// library.jsx — chord diagrams + tab snippets + backing tracks.

import { useEffect, useState } from "react";
import { BACKING, CHORDS, TABS } from "../content.js";
import { drone } from "../audio.js";
import { Btn, Header } from "../components/atoms.jsx";
import { Modal } from "../components/modal.jsx";
import { ChordDiagram } from "../components/wireframe.jsx";
import { baseFont, c, screenStyle } from "../theme.js";

export function LibraryScreen() {
  const [tab, setTab] = useState("chords");
  return (
    <div style={screenStyle}>
      <Header left="TOOLS · LIBRARY" right="REF" />
      <div style={{ fontSize: 22, marginBottom: 14 }}>library</div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["chords", "tabs", "backing"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: tab === t ? c.fg : "transparent",
              color: tab === t ? c.bg : c.fg,
              border: `1px solid ${tab === t ? c.fg : c.border}`,
              padding: "14px 0",
              minHeight: 48,
              font: "inherit",
              fontFamily: baseFont,
              fontSize: 13,
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "chords" && <ChordsTab />}
      {tab === "tabs" && <TabsTab />}
      {tab === "backing" && <BackingTab />}
    </div>
  );
}

function ChordsTab() {
  const [zoom, setZoom] = useState(null);
  return (
    <>
      <div style={{ color: c.muted, fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
        tap any chord to zoom.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {Object.values(CHORDS).map((ch) => (
          <button
            key={ch.name}
            onClick={() => setZoom(ch)}
            style={{
              border: `1px solid ${c.border}`,
              padding: 10,
              display: "flex",
              justifyContent: "center",
              background: c.panel,
              cursor: "pointer",
              minHeight: 110,
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            <ChordDiagram chord={ch} size="md" />
          </button>
        ))}
      </div>

      <Modal open={!!zoom} onClose={() => setZoom(null)}>
        {zoom && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <ChordDiagram chord={zoom} size="lg" />
            <div style={{ color: c.muted, fontSize: 11, letterSpacing: 1 }}>
              tap outside to close
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function TabsTab() {
  return (
    <>
      <div style={{ color: c.muted, fontSize: 11, marginBottom: 12 }}>
        drills + scale shapes. monospace for life.
      </div>
      {Object.entries(TABS).map(([key, t]) => (
        <div key={key} style={{ border: `1px solid ${c.border}`, padding: "12px 14px", marginBottom: 10, background: c.panel }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 14 }}>{t.name}</div>
            <div style={{ color: c.muted, fontSize: 11 }}>{t.bpm} bpm</div>
          </div>
          <pre style={{ margin: 0, fontFamily: baseFont, fontSize: 11, color: c.fg, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre" }}>
            {t.lines.join("\n")}
          </pre>
        </div>
      ))}
    </>
  );
}

function BackingTab() {
  const [playingId, setPlayingId] = useState(null);
  useEffect(() => () => drone.stop(), []);

  const play = (id) => {
    if (playingId === id) {
      drone.stop();
      setPlayingId(null);
    } else {
      drone.stop();
      drone.start(BACKING[id]);
      setPlayingId(id);
    }
  };

  return (
    <>
      <div style={{ color: c.muted, fontSize: 11, marginBottom: 12 }}>
        looping progressions. synthesized in-browser, no files.
      </div>
      {Object.entries(BACKING).map(([id, t]) => {
        const isPlaying = playingId === id;
        return (
          <div key={id} style={{
            border: `1px solid ${isPlaying ? c.amber : c.border}`,
            padding: "12px 14px",
            marginBottom: 10,
            background: c.panel,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{ fontSize: 14 }}>{t.name}</div>
              <div style={{ color: c.muted, fontSize: 11 }}>{t.bpm} bpm · {t.key}</div>
            </div>
            <div style={{ color: c.dim, fontSize: 12, marginBottom: 6 }}>
              {t.chords.join(" / ")}
            </div>
            <div style={{ color: c.muted, fontSize: 11, fontStyle: "italic", marginBottom: 10 }}>
              {t.description}
            </div>
            <Btn size="sm" variant={isPlaying ? "accent" : "ghost"} onClick={() => play(id)}>
              {isPlaying ? "⏸ stop" : "▷ play loop"}
            </Btn>
          </div>
        );
      })}
    </>
  );
}
