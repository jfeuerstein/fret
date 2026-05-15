// tape.jsx — full guitar practice prototype
// cassette + workout metaphor. fully interactive, real audio.
// screens: today (home), session, week, tuner, library
// nav via bottom tab bar

import { useState, useEffect, useRef } from "react";
import { Store, useStore } from "../store.js";
import {
  CHORDS,
  TABS,
  BACKING,
  GUITAR_STRINGS,
  fmtTime,
  freqToNote,
} from "../content.js";
import { metronome, tuner, drone } from "../audio.js";
import { generateSession } from "../generator.js";

const c = {
  bg: "#0a0a0a",
  panel: "#111",
  panel2: "#161616",
  fg: "#e0e0e0",
  dim: "#999",
  muted: "#666",
  faint: "#3a3a3a",
  border: "#333",
  green: "#44ff44",
  amber: "#ff8844",
  red: "#ff6b6b",
  blue: "#4a9eff",
  magenta: "#ff5cf2",
};

const baseFont = '"Courier New", ui-monospace, monospace';

// ─── shared atoms ─────────────────────────────────────────────
function Btn({
  children,
  onClick,
  variant = "ghost",
  full = true,
  size = "md",
  style,
}) {
  const [hover, setHover] = useState(false);
  const variants = {
    ghost: {
      bg: "transparent",
      fg: c.fg,
      br: c.border,
      hbg: c.fg,
      hfg: c.bg,
    },
    solid: {
      bg: c.fg,
      fg: c.bg,
      br: c.fg,
      hbg: c.dim,
      hfg: c.bg,
    },
    accent: {
      bg: "transparent",
      fg: c.amber,
      br: c.amber,
      hbg: c.amber,
      hfg: c.bg,
    },
    success: {
      bg: c.green,
      fg: c.bg,
      br: c.green,
      hbg: c.fg,
      hfg: c.bg,
    },
    danger: {
      bg: "transparent",
      fg: c.red,
      br: c.red,
      hbg: c.red,
      hfg: c.bg,
    },
  };
  const v = variants[variant];
  const pad =
    size === "lg"
      ? "16px 18px"
      : size === "sm"
        ? "8px 10px"
        : "12px 14px";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? v.hbg : v.bg,
        color: hover ? v.hfg : v.fg,
        border: `1px solid ${hover ? v.hbg : v.br}`,
        padding: pad,
        font: "inherit",
        fontFamily: baseFont,
        fontSize:
          size === "lg" ? 14 : size === "sm" ? 11 : 13,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        width: full ? "100%" : "auto",
        cursor: "pointer",
        borderRadius: 0,
        transition: "all 0.12s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Header({ left, right, mb = 14 }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: mb,
      }}
    >
      <div
        style={{
          color: c.muted,
          fontSize: 10,
          letterSpacing: 3,
        }}
      >
        {left}
      </div>
      <div
        style={{
          color: c.muted,
          fontSize: 10,
          letterSpacing: 2,
        }}
      >
        {right}
      </div>
    </div>
  );
}

function Section({ title, right, children, mt = 18 }) {
  return (
    <div style={{ marginTop: mt }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          color: c.muted,
          fontSize: 10,
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        <span>{title}</span>
        {right && <span>{right}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── home / today ─────────────────────────────────────────────
function HomeScreen({ goSession, goLibrary }) {
  const profile = useStore((s) => s.profile);
  const history = useStore((s) => s.history);
  const [t, setT] = useState(null);

  useEffect(() => {
    if (!t && profile) {
      setT(
        generateSession({
          focus: "technique", // or derive from week, see below
          sessionLength: profile.sessionLength,
          history,
        }),
      );
    }
  }, [t, profile, history]);

  if (!t) return null;
  const streak = useStore((s) => s.streak);
  const lastSession = useStore(
    (s) => s.history.sessions[0],
  );
  const [hover, setHover] = useState(false);

  return (
    <div
      style={{
        padding: "74px 16px 100px",
        minHeight: "100%",
        boxSizing: "border-box",
        background: c.bg,
        color: c.fg,
        fontFamily: baseFont,
        fontSize: 13,
      }}
    >
      <Header
        left="SAT · MAY 09"
        right={`DAY ${String(t.day).padStart(3, "0")}`}
      />

      {/* hero cassette */}
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          border: `2px solid ${c.fg}`,
          padding: "14px 14px 16px",
          background:
            "linear-gradient(180deg, #181818 0%, #0a0a0a 100%)",
          marginBottom: 18,
          position: "relative",
        }}
      >
        <div
          style={{
            border: `1px solid ${c.border}`,
            padding: "10px 12px",
            marginBottom: 14,
            background: c.bg,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                color: c.muted,
                fontSize: 10,
                letterSpacing: 2,
              }}
            >
              SIDE A
            </div>
            <div
              style={{
                color: c.muted,
                fontSize: 10,
                letterSpacing: 2,
              }}
            >
              {t.duration} MIN · {t.blocks.length} TRK
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              marginTop: 6,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              color: c.dim,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {t.subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
            padding: "6px 0 10px",
          }}
        >
          <window.WfCassette
            width={240}
            height={140}
            color="#5a5a5a"
            accent={hover ? c.amber : "#888"}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 4px 0",
            borderTop: `1px dashed ${c.border}`,
            marginTop: 4,
          }}
        >
          <div
            style={{
              color: c.amber,
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            ★ STREAK {String(s.streak).padStart(3, "0")}
          </div>
          <div
            style={{
              color: c.muted,
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            {s.totalAllTime} ALL-TIME
          </div>
        </div>
      </div>

      {/* big play */}
      <button
        onClick={goSession}
        style={{
          width: "100%",
          background: c.fg,
          color: c.bg,
          border: "none",
          padding: "20px 0",
          font: "inherit",
          fontFamily: baseFont,
          fontSize: 18,
          letterSpacing: 4,
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        ▷ PLAY SIDE A
      </button>
      <Btn size="sm">↺ EJECT — SKIP TODAY</Btn>

      {/* tracklist preview */}
      <Section title="TRACKLIST" right="BPM · TIME" mt={20}>
        {t.blocks.map((b, i) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom:
                i === t.blocks.length - 1
                  ? "none"
                  : `1px dashed ${c.border}`,
              padding: "8px 0",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  color: c.muted,
                  fontSize: 11,
                  width: 22,
                }}
              >
                A{String(i + 1).padStart(2, "0")}
              </span>
              <span>{b.label}</span>
            </div>
            <div
              style={{
                color: c.muted,
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {b.bpm
                ? String(b.bpm).padStart(3, "0")
                : " — "}{" "}
              · {String(b.duration).padStart(2, "0")}:00
            </div>
          </div>
        ))}
      </Section>

      <Section title="LAST PLAY">
        <div
          style={{
            padding: "12px 14px",
            border: `1px solid ${c.border}`,
            background: c.panel,
          }}
        >
          <div
            style={{
              color: c.muted,
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            {s.lastSession.day.toUpperCase()}
          </div>
          <div
            style={{
              color: c.dim,
              fontSize: 12,
              marginTop: 6,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            "{s.lastSession.note}"
          </div>
        </div>
      </Section>

      <Section title="QUICK TOOLS" mt={18}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          <Btn size="sm" onClick={goLibrary}>
            ♪ chords
          </Btn>
          <Btn size="sm" onClick={goLibrary}>
            ≡ tabs
          </Btn>
        </div>
      </Section>
    </div>
  );
}

// ─── session ──────────────────────────────────────────────────
function SessionScreen() {
  const profile = useStore((s) => s.profile);
  const history = useStore((s) => s.history);
  const [t, setT] = useState(null);

  useEffect(() => {
    if (!t && profile) {
      setT(
        generateSession({
          focus: "technique", // or derive from week, see below
          sessionLength: profile.sessionLength,
          history,
        }),
      );
    }
  }, [t, profile, history]);

  if (!t) return null;
  const [done, setDone] = useState({});
  const [activeIdx, setActiveIdx] = useState(2);
  const [bpm, setBpm] = useState(t.blocks[2].bpm);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [beat, setBeat] = useState(-1);
  const [droning, setDroning] = useState(false);

  const block = t.blocks[activeIdx];

  // metronome control
  useEffect(() => {
    if (playing && block.bpm > 0) {
      metronome.start(bpm, (b) => setBeat(b));
    } else {
      metronome.stop();
      setBeat(-1);
    }
    return () => metronome.stop();
  }, [playing, activeIdx]);

  useEffect(() => {
    if (playing) metronome.setBpm(bpm);
  }, [bpm, playing]);

  // timer
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(
      () => setElapsed((x) => x + 1 / 60),
      1000,
    );
    return () => clearInterval(id);
  }, [playing]);

  const pct = Math.min(1, elapsed / block.duration);
  const remaining = Math.max(0, block.duration - elapsed);

  const next = () => {
    setDone((d) => ({ ...d, [block.id]: true }));
    if (activeIdx < t.blocks.length - 1) {
      const ni = activeIdx + 1;
      setActiveIdx(ni);
      setBpm(t.blocks[ni].bpm || 90);
      setElapsed(0);
      setPlaying(false);
      if (droning) {
        drone.stop();
        setDroning(false);
      }
    } else {
      setPlaying(false);
    }
  };
  const prev = () => {
    if (activeIdx > 0) {
      const ni = activeIdx - 1;
      setActiveIdx(ni);
      setBpm(t.blocks[ni].bpm || 90);
      setElapsed(0);
      setPlaying(false);
      if (droning) {
        drone.stop();
        setDroning(false);
      }
    }
  };

  const togDrone = () => {
    if (droning) {
      drone.stop();
      setDroning(false);
    } else if (block.backing && BACKING[block.backing]) {
      drone.start(BACKING[block.backing]);
      setDroning(true);
    }
  };

  // cleanup on unmount
  useEffect(
    () => () => {
      metronome.stop();
      drone.stop();
    },
    [],
  );

  const tabData = block.tab ? TABS[block.tab] : null;

  return (
    <div
      style={{
        padding: "74px 16px 100px",
        minHeight: "100%",
        boxSizing: "border-box",
        background: c.bg,
        color: c.fg,
        fontFamily: baseFont,
        fontSize: 13,
      }}
    >
      <Header
        left={playing ? "▷ NOW PLAYING" : "⏸ PAUSED"}
        right="SIDE A"
      />

      {/* track header */}
      <div
        style={{
          marginBottom: 14,
          borderBottom: `1px solid ${c.border}`,
          paddingBottom: 12,
        }}
      >
        <div
          style={{
            color: c.muted,
            fontSize: 11,
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          TRACK {String(activeIdx + 1).padStart(2, "0")} /{" "}
          {String(t.blocks.length).padStart(2, "0")}
          {" · "}
          <span style={{ color: c.dim }}>{block.kind}</span>
        </div>
        <div
          style={{
            fontSize: 24,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {block.label}
        </div>
        <div
          style={{
            color: c.dim,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {block.drill}
        </div>
      </div>

      {/* big bpm */}
      {block.bpm > 0 ? (
        <div
          style={{
            border: `1px solid ${c.border}`,
            padding: "14px 16px 16px",
            marginBottom: 14,
            textAlign: "center",
            position: "relative",
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
            BPM
          </div>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1,
              letterSpacing: 4,
              color: c.fg,
              fontVariantNumeric: "tabular-nums",
              textShadow: playing
                ? `0 0 12px ${c.amber}55`
                : "none",
              transition: "text-shadow 0.2s",
            }}
          >
            {String(bpm).padStart(3, "0")}
          </div>

          {/* live beat indicator */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginTop: 14,
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  width: 14,
                  height: 14,
                  background:
                    i === beat ? c.amber : c.faint,
                  transition: "background 0.05s",
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 14,
            }}
          >
            <button
              onClick={() =>
                setBpm((x) => Math.max(40, x - 5))
              }
              style={knobBtn}
            >
              −5
            </button>
            <button
              onClick={() =>
                setBpm((x) => Math.max(40, x - 1))
              }
              style={knobBtn}
            >
              −1
            </button>
            <button
              onClick={() => setBpm((x) => x + 1)}
              style={knobBtn}
            >
              +1
            </button>
            <button
              onClick={() => setBpm((x) => x + 5)}
              style={knobBtn}
            >
              +5
            </button>
          </div>

          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              ...knobBtn,
              marginTop: 8,
              width: "100%",
              flex: "none",
              background: playing ? "transparent" : c.fg,
              color: playing ? c.fg : c.bg,
              borderColor: playing ? c.border : c.fg,
              padding: "12px 0",
              fontSize: 14,
              letterSpacing: 3,
            }}
          >
            {playing ? "⏸ STOP CLICK" : "▷ START CLICK"}
          </button>
        </div>
      ) : (
        <div
          style={{
            border: `1px dashed ${c.border}`,
            padding: "20px 16px",
            marginBottom: 14,
            textAlign: "center",
            color: c.muted,
            fontSize: 12,
          }}
        >
          [ no click track — feel it ]
        </div>
      )}

      {/* tape progress */}
      <div
        style={{
          background: c.panel,
          border: `1px solid ${c.border}`,
          padding: "12px 14px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Reels size={26} spinning={playing} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: c.muted,
                marginBottom: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span>{fmtTime(elapsed)}</span>
              <span>−{fmtTime(remaining)}</span>
            </div>
            <div
              style={{
                height: 4,
                background: c.faint,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct * 100}%`,
                  background: c.fg,
                }}
              />
            </div>
          </div>
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              ...knobBtn,
              width: 44,
              padding: "8px 0",
              fontSize: 16,
              flex: "none",
              background: playing ? "transparent" : c.fg,
              color: playing ? c.fg : c.bg,
            }}
          >
            {playing ? "⏸" : "▷"}
          </button>
        </div>
      </div>

      {/* drill detail */}
      <div
        style={{
          color: c.dim,
          fontSize: 12,
          lineHeight: 1.6,
          padding: "12px 14px",
          border: `1px solid ${c.border}`,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            color: c.muted,
            fontSize: 10,
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          NOTES
        </div>
        {block.detail}
      </div>

      {/* tab if available */}
      {tabData && (
        <div
          style={{
            border: `1px solid ${c.border}`,
            padding: "10px 12px",
            marginBottom: 14,
            background: c.panel2,
          }}
        >
          <div
            style={{
              color: c.muted,
              fontSize: 10,
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            TAB · {tabData.name.toUpperCase()}
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: baseFont,
              fontSize: 11,
              color: c.fg,
              lineHeight: 1.5,
              overflowX: "auto",
              whiteSpace: "pre",
            }}
          >
            {tabData.lines.join("\n")}
          </pre>
        </div>
      )}

      {/* backing */}
      {block.backing && BACKING[block.backing] && (
        <div
          style={{
            border: `1px solid ${droning ? c.amber : c.border}`,
            padding: "12px 14px",
            marginBottom: 14,
            background: c.panel,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                color: c.muted,
                fontSize: 10,
                letterSpacing: 2,
              }}
            >
              BACKING TRACK
            </div>
            <div
              style={{
                color: droning ? c.amber : c.muted,
                fontSize: 10,
                letterSpacing: 2,
              }}
            >
              {droning ? "▷ LIVE" : "◌ READY"}
            </div>
          </div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            {BACKING[block.backing].name}
          </div>
          <div
            style={{
              color: c.dim,
              fontSize: 11,
              marginBottom: 6,
            }}
          >
            {BACKING[block.backing].chords.join(" / ")}
          </div>
          <div
            style={{
              color: c.muted,
              fontSize: 11,
              marginBottom: 10,
              fontStyle: "italic",
            }}
          >
            {BACKING[block.backing].description}
          </div>
          <Btn
            size="sm"
            variant={droning ? "accent" : "ghost"}
            onClick={togDrone}
          >
            {droning ? "⏸ stop backing" : "▷ play backing"}
          </Btn>
        </div>
      )}

      {/* transport */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 8 }}
      >
        <button
          onClick={prev}
          style={{ ...transport, flex: 1 }}
        >
          ⏮
        </button>
        <button
          onClick={next}
          style={{ ...transport, flex: 1 }}
        >
          ⏭
        </button>
      </div>
      <button
        onClick={next}
        style={{
          width: "100%",
          background: c.green,
          color: c.bg,
          border: "none",
          padding: "14px 0",
          font: "inherit",
          fontFamily: baseFont,
          fontSize: 13,
          letterSpacing: 3,
          cursor: "pointer",
        }}
      >
        ✓ TRACK DONE — NEXT
      </button>

      {/* tracklist mini */}
      <Section title="UP NEXT" mt={20}>
        {t.blocks.map((b, i) => {
          const isDone = done[b.id];
          const isActive = i === activeIdx;
          return (
            <div
              key={b.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                color: isActive
                  ? c.amber
                  : isDone
                    ? c.muted
                    : c.dim,
                fontSize: 12,
                opacity: isDone ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ color: c.muted, width: 22 }}>
                  A{String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    textDecoration: isDone
                      ? "line-through"
                      : "none",
                  }}
                >
                  {b.label}
                </span>
              </div>
              <span
                style={{
                  color: c.muted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(b.duration).padStart(2, "0")}:00
              </span>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

const knobBtn = {
  flex: 1,
  background: "transparent",
  color: c.fg,
  border: `1px solid ${c.border}`,
  padding: "8px 0",
  font: "inherit",
  fontFamily: baseFont,
  fontSize: 13,
  letterSpacing: 1,
  cursor: "pointer",
};
const transport = {
  background: "transparent",
  color: c.fg,
  border: `1px solid ${c.border}`,
  padding: "14px 0",
  font: "inherit",
  fontFamily: baseFont,
  fontSize: 16,
  cursor: "pointer",
  letterSpacing: 2,
};

function Reels({ size = 50, spinning = true }) {
  const Reel = ({ delay = 0 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      style={{
        animation: spinning
          ? `cSpin 3s linear infinite`
          : "none",
        animationDelay: `${delay}s`,
      }}
    >
      <circle
        cx="25"
        cy="25"
        r="22"
        fill="none"
        stroke={c.faint}
        strokeWidth="1.5"
      />
      <circle cx="25" cy="25" r="6" fill={c.faint} />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="25"
          y1="25"
          x2={25 + Math.cos((deg * Math.PI) / 180) * 18}
          y2={25 + Math.sin((deg * Math.PI) / 180) * 18}
          stroke={c.faint}
          strokeWidth="1.5"
        />
      ))}
      <circle cx="25" cy="8" r="2" fill={c.muted} />
    </svg>
  );
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Reel />
      <Reel delay={-1.5} />
      <style>{`@keyframes cSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── weekly ───────────────────────────────────────────────────
function WeeklyScreen() {
  const w = useStore((s) => s.week) || [];
  const streak = useStore((s) => s.streak);
  const lastSession = useStore(
    (s) => s.history.sessions[0],
  );
  const [selected, setSelected] = useState(5);
  const sel = w[selected];
  const doneCount = w.filter(
    (d) => d.status === "done",
  ).length;
  const planned = w.filter(
    (d) => d.status !== "rest",
  ).length;

  return (
    <div
      style={{
        padding: "74px 16px 100px",
        minHeight: "100%",
        boxSizing: "border-box",
        background: c.bg,
        color: c.fg,
        fontFamily: baseFont,
        fontSize: 13,
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <div
          style={{
            color: c.muted,
            fontSize: 10,
            letterSpacing: 3,
          }}
        >
          TAPE RACK
        </div>
        <div style={{ fontSize: 22, marginTop: 4 }}>
          w. of may 04
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          color: c.muted,
          fontSize: 11,
          marginBottom: 18,
        }}
      >
        <span>
          {doneCount}/{planned} played
        </span>
        <span style={{ color: c.faint }}>·</span>
        <span>{s.totalMinutes}m total</span>
        <span style={{ color: c.faint }}>·</span>
        <span style={{ color: c.amber }}>
          ★ {s.streak}d
        </span>
      </div>

      {/* tape spines row */}
      <div
        style={{
          display: "flex",
          gap: 5,
          marginBottom: 18,
        }}
      >
        {w.map((d, i) => {
          const isSel = i === selected;
          const isDone = d.status === "done";
          const isToday = d.status === "today";
          const isRest = d.status === "rest";
          return (
            <div
              key={d.day}
              onClick={() => setSelected(i)}
              style={{
                flex: 1,
                cursor: "pointer",
                border: `1.5px solid ${isSel ? c.fg : isToday ? c.amber : c.border}`,
                background: isSel ? c.panel : "transparent",
                padding: "10px 4px 6px",
                textAlign: "center",
                position: "relative",
                opacity: isRest ? 0.45 : 1,
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  color: isToday ? c.amber : c.muted,
                  fontSize: 9,
                  letterSpacing: 1.5,
                }}
              >
                {d.day.toUpperCase()}
              </div>
              <div
                style={{
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "4px 0",
                }}
              >
                {isRest ? (
                  <span
                    style={{ color: c.muted, fontSize: 16 }}
                  >
                    —
                  </span>
                ) : (
                  <Reels size={18} spinning={isToday} />
                )}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: isDone
                    ? c.green
                    : isToday
                      ? c.amber
                      : c.muted,
                }}
              >
                {isDone
                  ? "✓"
                  : isToday
                    ? "▷"
                    : isRest
                      ? "—"
                      : "○"}
              </div>
            </div>
          );
        })}
      </div>

      {/* selected detail */}
      <div
        style={{
          border: `1.5px solid ${c.fg}`,
          padding: "14px 16px",
          marginBottom: 14,
          background: c.panel,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              color: c.muted,
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            {sel.day.toUpperCase()} ·{" "}
            {sel.date.split(" ")[1]}
          </div>
          <div
            style={{
              color:
                sel.status === "done"
                  ? c.green
                  : sel.status === "today"
                    ? c.amber
                    : c.muted,
              fontSize: 10,
              letterSpacing: 2,
            }}
          >
            {sel.status === "done"
              ? "✓ PLAYED"
              : sel.status === "today"
                ? "▷ ON DECK"
                : sel.status === "rest"
                  ? "— REST"
                  : "QUEUED"}
          </div>
        </div>
        <div
          style={{
            fontSize: 22,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {sel.status === "rest" ? "rest day" : sel.focus}
        </div>
        <div
          style={{
            color: c.dim,
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {sel.short}
        </div>
        {sel.status !== "rest" && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 14,
              borderTop: `1px dashed ${c.border}`,
              paddingTop: 10,
            }}
          >
            <Mini
              label="DURATION"
              value={`${sel.minutes}m`}
            />
            <Mini
              label="PEAK BPM"
              value={
                sel.bpm
                  ? String(sel.bpm).padStart(3, "0")
                  : "—"
              }
            />
            <Mini label="TRACKS" value="07" />
          </div>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginTop: 14,
        }}
      >
        <Mini
          label="STREAK"
          value={`${s.streak}d`}
          accent
        />
        <Mini label="WEEK" value={`${s.totalMinutes}m`} />
        <Mini label="ALL-TIME" value={s.totalAllTime} />
      </div>

      {/* journal entries placeholder */}
      <Section title="JOURNAL" mt={20}>
        {w
          .filter((d) => d.status === "done")
          .slice(-3)
          .map((d, i) => (
            <div
              key={i}
              style={{
                padding: "10px 12px",
                borderBottom: `1px dashed ${c.border}`,
                fontSize: 12,
                color: c.dim,
              }}
            >
              <div
                style={{
                  color: c.muted,
                  fontSize: 10,
                  letterSpacing: 2,
                  marginBottom: 4,
                }}
              >
                {d.day.toUpperCase()} · {d.focus}
              </div>
              <div style={{ fontStyle: "italic" }}>
                "got box 1 clean at {d.bpm}bpm — felt the
                rhythm lock in."
              </div>
            </div>
          ))}
      </Section>
    </div>
  );
}

function Mini({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div
        style={{
          color: c.muted,
          fontSize: 9,
          letterSpacing: 1.5,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          color: accent ? c.amber : c.fg,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── tuner ────────────────────────────────────────────────────
function TunerScreen() {
  const [permission, setPermission] = useState("idle"); // idle | granted | denied
  const [pitch, setPitch] = useState(null);
  const [smoothPitch, setSmoothPitch] = useState(null);
  const pitchHistory = useRef([]);

  const start = async () => {
    try {
      await tuner.start((freq) => {
        // smooth via median of last 8
        const h = pitchHistory.current;
        h.push(freq);
        if (h.length > 8) h.shift();
        const sorted = [...h].sort((a, b) => a - b);
        const median =
          sorted[Math.floor(sorted.length / 2)];
        setPitch(freq);
        setSmoothPitch(median);
      });
      setPermission("granted");
    } catch (e) {
      setPermission("denied");
    }
  };

  useEffect(() => () => tuner.stop(), []);

  const note = smoothPitch ? freqToNote(smoothPitch) : null;
  // closest guitar string
  const closest =
    note && smoothPitch
      ? GUITAR_STRINGS.reduce(
          (best, s) => {
            const cents = Math.abs(
              1200 * Math.log2(smoothPitch / s.freq),
            );
            return cents < best.cents ? { s, cents } : best;
          },
          { s: null, cents: Infinity },
        )
      : null;

  return (
    <div
      style={{
        padding: "74px 16px 100px",
        minHeight: "100%",
        boxSizing: "border-box",
        background: c.bg,
        color: c.fg,
        fontFamily: baseFont,
        fontSize: 13,
      }}
    >
      <Header left="TOOLS · TUNER" right="A=440Hz" />

      <div style={{ fontSize: 22, marginBottom: 6 }}>
        tuner
      </div>
      <div
        style={{
          color: c.dim,
          fontSize: 12,
          marginBottom: 18,
        }}
      >
        play one string at a time. give it a sec.
      </div>

      {permission === "idle" && (
        <div
          style={{
            border: `1px solid ${c.border}`,
            padding: "24px 16px",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              marginBottom: 14,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <window.WfOrb
              size={70}
              color={c.muted}
              accent={c.amber}
            />
          </div>
          <div
            style={{
              color: c.dim,
              fontSize: 12,
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            this'll need your mic for a sec.
            <br />
            we don't keep the audio.
          </div>
          <Btn variant="solid" onClick={start}>
            ▷ enable mic
          </Btn>
        </div>
      )}

      {permission === "denied" && (
        <div
          style={{
            border: `1px solid ${c.red}`,
            padding: "14px 16px",
            color: c.red,
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          mic blocked. check browser settings, then refresh.
        </div>
      )}

      {permission === "granted" && (
        <>
          {/* big note display */}
          <div
            style={{
              border: `1px solid ${c.border}`,
              padding: "24px 16px",
              textAlign: "center",
              marginBottom: 16,
              position: "relative",
            }}
          >
            <div
              style={{
                color: c.muted,
                fontSize: 10,
                letterSpacing: 3,
                marginBottom: 8,
              }}
            >
              {closest
                ? `TARGET · ${closest.s.name}${closest.s.octave}`
                : "LISTENING"}
            </div>
            <div
              style={{
                fontSize: 80,
                lineHeight: 1,
                letterSpacing: 2,
                color: note
                  ? Math.abs(note.cents) < 5
                    ? c.green
                    : Math.abs(note.cents) < 15
                      ? c.amber
                      : c.fg
                  : c.faint,
                transition: "color 0.15s",
              }}
            >
              {note ? `${note.name}${note.octave}` : "— —"}
            </div>
            <div
              style={{
                color: c.muted,
                fontSize: 11,
                marginTop: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {smoothPitch
                ? `${smoothPitch.toFixed(1)} Hz`
                : "no signal"}
            </div>

            {/* cents meter */}
            <div
              style={{
                marginTop: 18,
                position: "relative",
              }}
            >
              <div
                style={{
                  height: 4,
                  background: c.faint,
                  position: "relative",
                }}
              >
                {/* center line */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -4,
                    bottom: -4,
                    width: 1,
                    background: c.fg,
                  }}
                />
                {/* needle */}
                {note && (
                  <div
                    style={{
                      position: "absolute",
                      top: -6,
                      height: 16,
                      width: 3,
                      left: `calc(50% + ${Math.max(-50, Math.min(50, note.cents)) * 0.9}%)`,
                      background:
                        Math.abs(note.cents) < 5
                          ? c.green
                          : c.amber,
                      transform: "translateX(-50%)",
                      transition:
                        "left 0.1s, background 0.1s",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: c.muted,
                  fontSize: 10,
                  marginTop: 6,
                  letterSpacing: 1,
                }}
              >
                <span>−50¢</span>
                <span>0</span>
                <span>+50¢</span>
              </div>
            </div>

            {note && (
              <div
                style={{
                  marginTop: 12,
                  color:
                    Math.abs(note.cents) < 5
                      ? c.green
                      : c.muted,
                  fontSize: 11,
                  letterSpacing: 2,
                }}
              >
                {Math.abs(note.cents) < 5
                  ? "✓ in tune"
                  : note.cents > 0
                    ? `↓ flatten ${note.cents}¢`
                    : `↑ tighten ${-note.cents}¢`}
              </div>
            )}
          </div>

          {/* live waveform */}
          <div
            style={{
              border: `1px solid ${c.border}`,
              padding: "10px 12px",
              marginBottom: 16,
              background: c.panel,
            }}
          >
            <div
              style={{
                color: c.muted,
                fontSize: 10,
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              SIGNAL
            </div>
            <window.WfWave
              width={320}
              height={36}
              color={c.amber}
              active
            />
          </div>

          {/* string targets */}
          <Section title="STRINGS · LOW → HIGH">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 4,
              }}
            >
              {GUITAR_STRINGS.map((s, i) => {
                const isClosest =
                  closest && closest.s === s;
                return (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${isClosest ? c.amber : c.border}`,
                      padding: "8px 0",
                      textAlign: "center",
                      background: isClosest
                        ? c.panel
                        : "transparent",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        color: isClosest ? c.amber : c.fg,
                      }}
                    >
                      {s.name}
                      {s.octave}
                    </div>
                    <div
                      style={{
                        color: c.muted,
                        fontSize: 9,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {s.freq.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          <div style={{ marginTop: 16 }}>
            <Btn
              size="sm"
              onClick={() => {
                tuner.stop();
                setPermission("idle");
                setPitch(null);
                setSmoothPitch(null);
              }}
            >
              ⏸ stop tuner
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}

// ─── library (chords + tabs + backing tracks) ────────────────
function LibraryScreen() {
  const [tab, setTab] = useState("chords");
  return (
    <div
      style={{
        padding: "74px 16px 100px",
        minHeight: "100%",
        boxSizing: "border-box",
        background: c.bg,
        color: c.fg,
        fontFamily: baseFont,
        fontSize: 13,
      }}
    >
      <Header left="TOOLS · LIBRARY" right="REF" />
      <div style={{ fontSize: 22, marginBottom: 14 }}>
        library
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {["chords", "tabs", "backing"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: tab === t ? c.fg : "transparent",
              color: tab === t ? c.bg : c.fg,
              border: `1px solid ${tab === t ? c.fg : c.border}`,
              padding: "10px 0",
              font: "inherit",
              fontFamily: baseFont,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
              cursor: "pointer",
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
  const chords = Object.values(CHORDS);
  return (
    <>
      <div
        style={{
          color: c.muted,
          fontSize: 11,
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        the staples. tap one for a bigger view (todo).
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
        }}
      >
        {chords.map((ch) => (
          <div
            key={ch.name}
            style={{
              border: `1px solid ${c.border}`,
              padding: 10,
              display: "flex",
              justifyContent: "center",
              background: c.panel,
            }}
          >
            <window.ChordDiagram chord={ch} size="md" />
          </div>
        ))}
      </div>
    </>
  );
}

function TabsTab() {
  const tabs = Object.entries(TABS);
  return (
    <>
      <div
        style={{
          color: c.muted,
          fontSize: 11,
          marginBottom: 12,
        }}
      >
        drills + scale shapes. monospace for life.
      </div>
      {tabs.map(([key, t]) => (
        <div
          key={key}
          style={{
            border: `1px solid ${c.border}`,
            padding: "12px 14px",
            marginBottom: 10,
            background: c.panel,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 14 }}>{t.name}</div>
            <div style={{ color: c.muted, fontSize: 11 }}>
              {t.bpm} bpm
            </div>
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: baseFont,
              fontSize: 11,
              color: c.fg,
              lineHeight: 1.5,
              overflowX: "auto",
              whiteSpace: "pre",
            }}
          >
            {t.lines.join("\n")}
          </pre>
        </div>
      ))}
    </>
  );
}

function BackingTab() {
  const tracks = Object.entries(BACKING);
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
      <div
        style={{
          color: c.muted,
          fontSize: 11,
          marginBottom: 12,
        }}
      >
        looping progressions. synthesized in-browser, no
        files.
      </div>
      {tracks.map(([id, t]) => {
        const isPlaying = playingId === id;
        return (
          <div
            key={id}
            style={{
              border: `1px solid ${isPlaying ? c.amber : c.border}`,
              padding: "12px 14px",
              marginBottom: 10,
              background: c.panel,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 4,
              }}
            >
              <div style={{ fontSize: 14 }}>{t.name}</div>
              <div style={{ color: c.muted, fontSize: 11 }}>
                {t.bpm} bpm · {t.key}
              </div>
            </div>
            <div
              style={{
                color: c.dim,
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              {t.chords.join(" / ")}
            </div>
            <div
              style={{
                color: c.muted,
                fontSize: 11,
                fontStyle: "italic",
                marginBottom: 10,
              }}
            >
              {t.description}
            </div>
            <Btn
              size="sm"
              variant={isPlaying ? "accent" : "ghost"}
              onClick={() => play(id)}
            >
              {isPlaying ? "⏸ stop" : "▷ play loop"}
            </Btn>
          </div>
        );
      })}
    </>
  );
}

// ─── tab bar nav ──────────────────────────────────────────────
function TabBar({ tab, setTab }) {
  const tabs = [
    { id: "home", label: "today", icon: "◧" },
    { id: "session", label: "play", icon: "▷" },
    { id: "weekly", label: "week", icon: "▦" },
    { id: "journal", label: "log", icon: "✎" },
    { id: "tuner", label: "tuner", icon: "◊" },
    { id: "library", label: "lib", icon: "≡" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 34,
        left: 0,
        right: 0,
        background: c.bg,
        borderTop: `1px solid ${c.border}`,
        padding: "8px 8px 6px",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 30,
      }}
    >
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              padding: "6px 4px",
              cursor: "pointer",
              color: active ? c.amber : c.muted,
              fontFamily: baseFont,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>
              {t.icon}
            </span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── app shell ────────────────────────────────────────────────
function TapeApp() {
  const [tab, setTab] = useState("home");
  const profile = useStore((s) => s.profile);
  const history = useStore((s) => s.history);
  const [today, setToday] = useState(null);

  useEffect(() => {
    if (profile && !today) {
      setToday(
        generateSession({
          focus: "technique",
          sessionLength: profile.sessionLength,
          history,
        }),
      );
    }
  }, [profile, history, today]);
  const [storeState, setStoreState] = useState(
    Store ? Store.get() : null,
  );

  useEffect(() => {
    if (!Store) return;
    return Store.subscribe(setStoreState);
  }, []);

  // onboarding gate
  if (
    window.Onboarding &&
    storeState &&
    !storeState.profile
  ) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          background: c.bg,
          overflow: "auto",
        }}
      >
        <window.Onboarding onDone={() => setTab("home")} />
      </div>
    );
  }

  const screens = {
    home: (
      <HomeScreen
        goSession={() => setTab("session")}
        goLibrary={() => setTab("library")}
      />
    ),
    session: <SessionScreen />,
    weekly: <WeeklyScreen />,
    journal: window.JournalScreen ? (
      <window.JournalScreen />
    ) : (
      <div />
    ),
    tuner: <TunerScreen />,
    library: <LibraryScreen />,
  };
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: c.bg,
      }}
    >
      {screens[tab]}
      <TabBar tab={tab} setTab={setTab} />
    </div>
  );
}

export { TapeApp };
