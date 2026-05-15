// onboarding.jsx — first-run setup. writes profile + week to the store.

import { useState } from "react";
import { Store } from "../store.js";
import { generateWeek } from "../generator.js";
import { WfHeadstock, WfOrb } from "../components/wireframe.jsx";
import { baseFont, c, onboardingStyle } from "../theme.js";

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    experience: "self-taught chords",
    sessionLength: 45,
    daysPerWeek: 5,
    focuses: ["technique", "lead"],
    goals: [],
  });

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
      art: <WfHeadstock width={120} height={180} color={c.dim} />,
      body: (
        <div style={{ color: c.dim, fontSize: 13, lineHeight: 1.6 }}>
          fret builds you a daily practice, gym-style. each
          day's a tape, each block a track. takes 30 seconds.
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
      art: <WfOrb size={120} color={c.amber} accent={c.amber} />,
      body: (
        <div style={{ color: c.dim, fontSize: 13, lineHeight: 1.6 }}>
          {profile.daysPerWeek} days/wk · {profile.sessionLength}m sessions · cycling:{" "}
          {profile.focuses.join(" / ")}
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <div style={onboardingStyle}>
      <div style={{ color: c.muted, fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>
        SETUP · {String(step + 1).padStart(2, "0")}/{String(steps.length).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{cur.title}</div>
      <div style={{ color: c.dim, fontSize: 13, marginBottom: 22 }}>{cur.sub}</div>

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
              background: i <= step ? c.amber : c.faint,
              transition: "background 0.2s",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} style={obtnGhost}>back</button>
        )}
        <button onClick={last ? finish : () => setStep((s) => s + 1)} style={obtnSolid}>
          {last ? "✓ build tape" : "next →"}
        </button>
      </div>
    </div>
  );
}

const obtnGhost = {
  flex: 1,
  background: "transparent",
  color: c.fg,
  border: `1px solid ${c.border}`,
  padding: "14px 0",
  font: "inherit",
  fontFamily: baseFont,
  fontSize: 13,
  letterSpacing: 2,
  textTransform: "uppercase",
  cursor: "pointer",
};
const obtnSolid = {
  ...obtnGhost,
  flex: 2,
  background: c.fg,
  color: c.bg,
  borderColor: c.fg,
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
              background: on ? c.fg : "transparent",
              color: on ? c.bg : c.fg,
              border: `1px solid ${on ? c.fg : c.border}`,
              padding: "12px 14px",
              textAlign: "left",
              font: "inherit",
              fontFamily: baseFont,
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
    <div style={{
      border: `1px solid ${c.border}`,
      padding: "20px 16px",
      textAlign: "center",
      background: c.panel,
    }}>
      <div style={{ fontSize: 56, lineHeight: 1, color: c.amber, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ color: c.muted, fontSize: 11, letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>
        {unit}
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", marginTop: 16, accentColor: c.amber }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", color: c.muted, fontSize: 10, marginTop: 4 }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
