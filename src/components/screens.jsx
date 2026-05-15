// screens.jsx — onboarding + journal screens.
// uses Store + generator. real ES imports, no window globals.

import { useEffect, useState } from "react";
import { Store, useStore } from "../store.js";
import { generateWeek } from "../generator.js";
import { WfHeadstock, WfOrb } from "./wireframe.jsx";

const sc = {
  bg: "#0a0a0a",
  panel: "#111",
  fg: "#e0e0e0",
  dim: "#999",
  muted: "#666",
  faint: "#3a3a3a",
  border: "#333",
  green: "#44ff44",
  amber: "#ff8844",
  red: "#ff6b6b",
};
const sFont = '"Courier New", ui-monospace, monospace';

// ─── onboarding ──────────────────────────────────────────────
export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    experience: "self-taught chords",
    sessionLength: 45,
    daysPerWeek: 5,
    focuses: ["technique", "lead"],
    goals: [],
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    Store.setProfile(profile);
    Store.setWeek(
      generateWeek({
        daysPerWeek: profile.daysPerWeek,
        sessionLength: profile.sessionLength,
        focuses: profile.focuses,
      }),
    );
    onDone?.();
  };

  const steps = [
    {
      title: "welcome",
      sub: "let's set up your routine.",
      art: <WfHeadstock width={120} height={180} color={sc.dim} />,
      body: (
        <div style={{ color: sc.dim, fontSize: 13, lineHeight: 1.6 }}>
          fret builds you a daily practice, gym-style. each
          day's a tape, each block a track. takes 30 seconds
          to set up.
        </div>
      ),
    },
    {
      title: "experience",
      sub: "where are you?",
      body: (
        <Choices
          options={[
            "just started",
            "self-taught chords",
            "comfortable, want to level up",
            "intermediate",
          ]}
          value={profile.experience}
          onChange={(v) => setProfile((p) => ({ ...p, experience: v }))}
        />
      ),
    },
    {
      title: "goals",
      sub: "pick all that apply.",
      body: (
        <Choices
          multi
          options={[
            "fingerpicking",
            "lead / solos",
            "play in a band",
            "theory fluency",
            "songwriting",
            "just vibe",
          ]}
          value={profile.goals}
          onChange={(v) => setProfile((p) => ({ ...p, goals: v }))}
        />
      ),
    },
    {
      title: "session length",
      sub: "minutes per practice.",
      body: (
        <Slider
          min={15} max={90} step={5}
          value={profile.sessionLength}
          onChange={(v) => setProfile((p) => ({ ...p, sessionLength: v }))}
          unit="min"
        />
      ),
    },
    {
      title: "days / week",
      sub: "rest days are good for you.",
      body: (
        <Slider
          min={3} max={7} step={1}
          value={profile.daysPerWeek}
          onChange={(v) => setProfile((p) => ({ ...p, daysPerWeek: v }))}
          unit="days"
        />
      ),
    },
    {
      title: "focus areas",
      sub: "cycled day-by-day.",
      body: (
        <Choices
          multi
          options={["technique", "lead", "fingerstyle", "theory"]}
          value={profile.focuses}
          onChange={(v) =>
            setProfile((p) => ({
              ...p,
              focuses: v.length ? v : ["technique"],
            }))
          }
        />
      ),
    },
    {
      title: "all set",
      sub: "we'll build today's tape now.",
      art: <WfOrb size={120} color={sc.amber} accent={sc.amber} />,
      body: (
        <div style={{ color: sc.dim, fontSize: 13, lineHeight: 1.6 }}>
          {profile.daysPerWeek} days/wk ·{" "}
          {profile.sessionLength}m sessions · cycling:{" "}
          {profile.focuses.join(" / ")}
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <div
      style={{
        padding: "44px 22px 32px",
        minHeight: "100%",
        boxSizing: "border-box",
        background: sc.bg,
        color: sc.fg,
        fontFamily: sFont,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ color: sc.muted, fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>
        SETUP · {String(step + 1).padStart(2, "0")}/{String(steps.length).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 24, marginBottom: 4, textTransform: "lowercase" }}>
        {cur.title}
      </div>
      <div style={{ color: sc.dim, fontSize: 13, marginBottom: 22 }}>
        {cur.sub}
      </div>

      {cur.art && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          {cur.art}
        </div>
      )}
      <div style={{ flex: 1 }}>{cur.body}</div>

      <div style={{ display: "flex", gap: 5, justifyContent: "center", margin: "16px 0" }}>
        {steps.map((_, i) => (
          <span
            key={i}
            style={{
              width: 18, height: 3,
              background: i <= step ? sc.amber : sc.faint,
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {step > 0 && (
          <button onClick={back} style={obtnGhost}>back</button>
        )}
        <button onClick={last ? finish : next} style={obtnSolid}>
          {last ? "✓ build tape" : "next →"}
        </button>
      </div>
    </div>
  );
}

const obtnGhost = {
  flex: 1,
  background: "transparent",
  color: sc.fg,
  border: `1px solid ${sc.border}`,
  padding: "14px 0",
  font: "inherit",
  fontFamily: sFont,
  fontSize: 13,
  letterSpacing: 2,
  textTransform: "uppercase",
  cursor: "pointer",
};
const obtnSolid = {
  ...obtnGhost,
  flex: 2,
  background: sc.fg,
  color: sc.bg,
  borderColor: sc.fg,
};

function Choices({ options, value, onChange, multi }) {
  const isOn = (o) => (multi ? (value || []).includes(o) : value === o);
  const tog = (o) => {
    if (multi) {
      const cur = value || [];
      onChange(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
    } else onChange(o);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((o) => {
        const on = isOn(o);
        return (
          <button
            key={o}
            onClick={() => tog(o)}
            style={{
              background: on ? sc.fg : "transparent",
              color: on ? sc.bg : sc.fg,
              border: `1px solid ${on ? sc.fg : sc.border}`,
              padding: "12px 14px",
              textAlign: "left",
              font: "inherit",
              fontFamily: sFont,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {on ? "[x] " : "[ ] "}{o}
          </button>
        );
      })}
    </div>
  );
}

function Slider({ min, max, step, value, onChange, unit }) {
  return (
    <div
      style={{
        border: `1px solid ${sc.border}`,
        padding: "20px 16px",
        textAlign: "center",
        background: sc.panel,
      }}
    >
      <div style={{ fontSize: 56, lineHeight: 1, color: sc.amber, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ color: sc.muted, fontSize: 11, letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>
        {unit}
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", marginTop: 16, accentColor: sc.amber }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", color: sc.muted, fontSize: 10, marginTop: 4 }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

// ─── journal screen ──────────────────────────────────────────
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
    <div
      style={{
        padding: "44px 16px 100px",
        minHeight: "100%",
        boxSizing: "border-box",
        background: sc.bg,
        color: sc.fg,
        fontFamily: sFont,
        fontSize: 13,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", color: sc.muted, fontSize: 10, letterSpacing: 3, marginBottom: 14 }}>
        <span>JOURNAL</span>
        <span>{entries.length} ENTRIES</span>
      </div>
      <div style={{ fontSize: 22, marginBottom: 14 }}>journal</div>

      <div style={{ border: `1px solid ${sc.border}`, padding: 12, marginBottom: 14, background: sc.panel }}>
        <div style={{ color: sc.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
          NEW ENTRY
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="one thing that clicked, one that didn't..."
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "transparent",
            color: sc.fg,
            border: `1px solid ${sc.border}`,
            borderRadius: 0,
            padding: 10,
            font: "inherit",
            fontFamily: sFont,
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
                background: mood === m ? sc.amber : "transparent",
                color: mood === m ? sc.bg : sc.dim,
                border: `1px solid ${mood === m ? sc.amber : sc.border}`,
                padding: "8px 0",
                font: "inherit",
                fontFamily: sFont,
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
            background: text.trim() ? sc.fg : sc.faint,
            color: sc.bg,
            border: "none",
            padding: "12px 0",
            font: "inherit",
            fontFamily: sFont,
            fontSize: 12,
            letterSpacing: 2,
            cursor: text.trim() ? "pointer" : "not-allowed",
          }}
        >
          + SAVE ENTRY
        </button>
      </div>

      <div style={{ color: sc.muted, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>
        HISTORY
      </div>
      {entries.length === 0 ? (
        <div style={{ color: sc.muted, fontSize: 12, fontStyle: "italic", padding: "20px 0", textAlign: "center" }}>
          no entries yet. write one after your next session.
        </div>
      ) : (
        entries.map((e, i) => (
          <div
            key={i}
            style={{
              padding: "12px 14px",
              border: `1px solid ${sc.border}`,
              marginBottom: 6,
              background: sc.panel,
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", color: sc.muted, fontSize: 10, letterSpacing: 1, marginBottom: 6 }}>
              <span>{e.date}</span>
              {e.mood && <span style={{ color: sc.amber }}>{e.mood}</span>}
            </div>
            <div style={{ color: sc.dim, lineHeight: 1.5 }}>{e.note}</div>
          </div>
        ))
      )}
    </div>
  );
}
