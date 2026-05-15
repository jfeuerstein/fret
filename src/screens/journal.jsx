// journal.jsx — practice notes. mood + free text, kept in localStorage.

import { useState } from "react";
import { Store, useStore } from "../store.js";
import { baseFont, c, screenStyle } from "../theme.js";

export function JournalScreen() {
  const journal = useStore((s) => s.journal);
  const [text, setText] = useState("");
  const [mood, setMood] = useState(null);

  const submit = () => {
    if (!text.trim()) return;
    Store.addJournal({ note: text.trim(), mood });
    setText("");
    setMood(null);
  };

  const entries = journal || [];

  return (
    <div style={screenStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", color: c.muted, fontSize: 10, letterSpacing: 3, marginBottom: 14 }}>
        <span>JOURNAL</span>
        <span>{entries.length} ENTRIES</span>
      </div>
      <div style={{ fontSize: 22, marginBottom: 14 }}>journal</div>

      <div style={{ border: `1px solid ${c.border}`, padding: 12, marginBottom: 14, background: c.panel }}>
        <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>NEW ENTRY</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="one thing that clicked, one that didn't..."
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "transparent",
            color: c.fg,
            border: `1px solid ${c.border}`,
            borderRadius: 0,
            padding: 10,
            font: "inherit",
            fontFamily: baseFont,
            fontSize: 13,
            resize: "vertical",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 4, marginTop: 8, marginBottom: 8 }}>
          {["rough", "meh", "solid", "fire"].map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              style={{
                flex: 1,
                background: mood === m ? c.amber : "transparent",
                color: mood === m ? c.bg : c.dim,
                border: `1px solid ${mood === m ? c.amber : c.border}`,
                padding: "8px 0",
                font: "inherit",
                fontFamily: baseFont,
                fontSize: 11,
                letterSpacing: 1,
                cursor: "pointer",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={!text.trim()}
          style={{
            width: "100%",
            background: text.trim() ? c.fg : c.faint,
            color: c.bg,
            border: "none",
            padding: "12px 0",
            font: "inherit",
            fontFamily: baseFont,
            fontSize: 12,
            letterSpacing: 2,
            cursor: text.trim() ? "pointer" : "not-allowed",
          }}
        >
          + SAVE ENTRY
        </button>
      </div>

      <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>HISTORY</div>
      {entries.length === 0 ? (
        <div style={{ color: c.muted, fontSize: 12, fontStyle: "italic", padding: "20px 0", textAlign: "center" }}>
          no entries yet. write one after your next session.
        </div>
      ) : (
        entries.map((e, i) => (
          <div key={i} style={{
            padding: "12px 14px",
            border: `1px solid ${c.border}`,
            marginBottom: 6,
            background: c.panel,
            fontSize: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: c.muted, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>
              <span>{e.date}</span>
              {e.mood && <span style={{ color: c.amber }}>{e.mood}</span>}
            </div>
            <div style={{ color: c.dim, lineHeight: 1.5 }}>{e.note}</div>
          </div>
        ))
      )}
    </div>
  );
}
