// App.jsx — minimal runnable shell wired to store, generator, push.
// the full prototype UI (tape, session, tuner, library, week) lives in
// the project root and should be ported into ./components/. see PORTING.md.

import { useEffect, useState } from "react";
import { Store, useStore } from "./store.js";
import {
  generateSession,
  generateWeek,
} from "./generator.js";
import { usePush } from "./usePush.js";
import { TapeApp } from "./components/tape.jsx";

const c = {
  bg: "#0a0a0a",
  panel: "#111",
  fg: "#e0e0e0",
  dim: "#999",
  muted: "#666",
  faint: "#3a3a3a",
  border: "#333",
  amber: "#ff8844",
  green: "#44ff44",
};

const font = '"Courier New", ui-monospace, monospace';

function Btn({ children, onClick, solid, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "14px 16px",
        background: solid ? c.fg : "transparent",
        color: solid ? c.bg : c.fg,
        border: `1px solid ${solid ? c.fg : c.border}`,
        fontFamily: font,
        fontSize: 13,
        letterSpacing: 2,
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Onboarding() {
  const [step, setStep] = useState(0);
  const [sessionLength, setSessionLength] = useState(45);
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  const finish = () => {
    Store.setProfile({
      sessionLength,
      daysPerWeek,
      focuses: [
        "technique",
        "lead",
        "fingerstyle",
        "theory",
      ],
    });
    Store.setWeek(
      generateWeek({ daysPerWeek, sessionLength }),
    );
  };

  return (
    <div
      style={{
        padding: "24px 22px",
        fontFamily: font,
        color: c.fg,
      }}
    >
      <div
        style={{
          color: c.muted,
          fontSize: 10,
          letterSpacing: 3,
          marginBottom: 4,
        }}
      >
        SETUP · {step + 1}/3
      </div>
      <div style={{ fontSize: 24, marginBottom: 22 }}>
        {step === 0 && "welcome"}
        {step === 1 && "session length"}
        {step === 2 && "days / week"}
      </div>

      {step === 0 && (
        <div
          style={{
            color: c.dim,
            fontSize: 13,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          fret builds you a daily practice, gym-style. takes
          30 seconds.
        </div>
      )}
      {step === 1 && (
        <Slider
          value={sessionLength}
          onChange={setSessionLength}
          min={15}
          max={90}
          step={5}
          unit="min"
        />
      )}
      {step === 2 && (
        <Slider
          value={daysPerWeek}
          onChange={setDaysPerWeek}
          min={3}
          max={7}
          step={1}
          unit="days"
        />
      )}

      <div
        style={{ marginTop: 24, display: "flex", gap: 8 }}
      >
        {step > 0 && (
          <Btn onClick={() => setStep((s) => s - 1)}>
            back
          </Btn>
        )}
        <Btn
          solid
          onClick={() =>
            step < 2 ? setStep((s) => s + 1) : finish()
          }
        >
          {step < 2 ? "next →" : "✓ build tape"}
        </Btn>
      </div>
    </div>
  );
}

function Slider({ value, onChange, min, max, step, unit }) {
  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        padding: "20px 16px",
        textAlign: "center",
        background: c.panel,
      }}
    >
      <div
        style={{
          fontSize: 56,
          lineHeight: 1,
          color: c.amber,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: c.muted,
          fontSize: 11,
          letterSpacing: 2,
          marginTop: 4,
          textTransform: "uppercase",
        }}
      >
        {unit}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{
          width: "100%",
          marginTop: 16,
          accentColor: c.amber,
        }}
      />
    </div>
  );
}

function Today() {
  const profile = useStore((s) => s.profile);
  const history = useStore((s) => s.history);
  const streak = useStore((s) => s.streak);
  const [session, setSession] = useState(null);
  const push = usePush();

  useEffect(() => {
    if (!session && profile) {
      setSession(
        generateSession({
          sessionLength: profile.sessionLength,
          history,
        }),
      );
    }
  }, [session, profile, history]);

  if (!session) return null;

  const complete = () => {
    Store.completeSession(session, session.duration);
    setSession(null);
  };

  return (
    <div style={{ padding: "24px 16px", fontFamily: font }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: c.muted,
          fontSize: 10,
          letterSpacing: 3,
          marginBottom: 12,
        }}
      >
        <span>TODAY · {session.title}</span>
        <span>STREAK {streak.count}</span>
      </div>
      <div style={{ fontSize: 22, marginBottom: 4 }}>
        {session.subtitle}
      </div>
      <div
        style={{
          color: c.dim,
          fontSize: 13,
          marginBottom: 18,
        }}
      >
        {session.duration} min · {session.blocks.length}{" "}
        blocks
      </div>

      {session.blocks.map((b) => (
        <div
          key={b.id}
          style={{
            padding: "12px 14px",
            border: `1px solid ${c.border}`,
            marginBottom: 6,
            background: c.panel,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: c.muted,
              fontSize: 10,
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            <span>{b.label.toUpperCase()}</span>
            <span>
              {b.duration}m{b.bpm ? ` · ${b.bpm}bpm` : ""}
            </span>
          </div>
          <div style={{ fontSize: 14 }}>{b.drill}</div>
          <div
            style={{
              color: c.dim,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {b.detail}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Btn solid onClick={complete}>
          ✓ mark session done
        </Btn>
        {push.supported && !push.subscription && (
          <Btn
            onClick={() =>
              push
                .subscribe()
                .catch((e) => alert(e.message))
            }
          >
            🔔 enable practice reminders
          </Btn>
        )}
        {push.subscription && (
          <Btn onClick={push.unsubscribe}>
            🔕 disable reminders
          </Btn>
        )}
        <Btn
          onClick={() => {
            Store.reset();
            location.reload();
          }}
        >
          ↺ reset everything
        </Btn>
      </div>
    </div>
  );
}

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
