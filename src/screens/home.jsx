// home.jsx — today screen. cassette artwork + tracklist preview.

import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store.js";
import { generateSession } from "../generator.js";
import { generateDeck } from "../quiz/cards.js";
import { deckStats } from "../quiz/srs.js";
import { Btn, Header, Section } from "../components/atoms.jsx";
import { WfCassette } from "../components/wireframe.jsx";
import { baseFont, c, screenStyle, todayDayKey, todayKey, todayLabel } from "../theme.js";

export function HomeScreen({ goSession, goLibrary, goQuiz }) {
  const profile = useStore((s) => s.profile);
  const history = useStore((s) => s.history);
  const streak = useStore((s) => s.streak);
  const lastSession = useStore((s) => s.history.sessions[0]);
  const week = useStore((s) => s.week?.days);
  const quiz = useStore((s) => s.quiz);
  const lastPracticed = useStore((s) => s.lastPracticed);

  const focus = useMemo(() => {
    const today = todayDayKey();
    const todayPlan = (week || []).find((d) => d.day === today);
    return todayPlan && todayPlan.focus !== "rest" ? todayPlan.focus : "technique";
  }, [week]);

  const session = useMemo(() => {
    if (!profile) return null;
    return generateSession({
      focus,
      sessionLength: profile.sessionLength,
      history,
      seed: todayKey(),
    });
  }, [profile, history, focus]);

  const deck = useMemo(() => generateDeck(), []);
  const stats = deckStats(deck, quiz);
  const [hover, setHover] = useState(false);

  // pre-warm the next render path
  useEffect(() => { /* no-op, kept for parity */ }, []);

  if (!profile || !session) return null;

  const practicedToday = lastPracticed === todayKey();

  return (
    <div style={screenStyle}>
      <Header
        left={todayLabel()}
        right={`STREAK ${String(streak.count).padStart(3, "0")}`}
      />

      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          border: `2px solid ${c.fg}`,
          padding: "14px 14px 16px",
          background: "linear-gradient(180deg, #181818 0%, #0a0a0a 100%)",
          marginBottom: 18,
        }}
      >
        <div style={{ border: `1px solid ${c.border}`, padding: "10px 12px", marginBottom: 14, background: c.bg }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2 }}>SIDE A</div>
            <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2 }}>
              {session.duration} MIN · {session.blocks.length} TRK
            </div>
          </div>
          <div style={{ fontSize: 22, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>
            {session.title}
          </div>
          <div style={{ color: c.dim, fontSize: 12, marginTop: 2 }}>{session.subtitle}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 10px" }}>
          <WfCassette width={240} height={140} color="#5a5a5a" accent={hover ? c.amber : "#888"} />
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 4px 0",
          borderTop: `1px dashed ${c.border}`,
          marginTop: 4,
        }}>
          <div style={{ color: c.amber, fontSize: 10, letterSpacing: 2 }}>
            ★ STREAK {String(streak.count).padStart(3, "0")}
          </div>
          <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2 }}>
            {streak.totalAllTime}m ALL-TIME
          </div>
        </div>
      </div>

      <button
        onClick={goSession}
        style={{
          width: "100%",
          background: practicedToday ? c.green : c.fg,
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
        {practicedToday ? "✓ PLAYED — REPLAY?" : "▷ PLAY SIDE A"}
      </button>

      <Section title="TRACKLIST" right="BPM · TIME" mt={20}>
        {session.blocks.map((b, i) => (
          <div key={b.id} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: i === session.blocks.length - 1 ? "none" : `1px dashed ${c.border}`,
            padding: "8px 0",
            fontSize: 13,
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ color: c.muted, fontSize: 11, width: 22 }}>
                A{String(i + 1).padStart(2, "0")}
              </span>
              <span>{b.label}</span>
            </div>
            <div style={{ color: c.muted, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
              {b.bpm ? String(b.bpm).padStart(3, "0") : " — "} · {String(b.duration).padStart(2, "0")}:00
            </div>
          </div>
        ))}
      </Section>

      <Section title="THEORY DECK" right={`${stats.due} due`} mt={20}>
        <div style={{
          padding: "12px 14px",
          border: `1px solid ${stats.due > 0 ? c.amber : c.border}`,
          background: c.panel,
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div style={{ fontSize: 12 }}>
            <div style={{ color: c.fg, marginBottom: 2 }}>
              {stats.due > 0 ? `${stats.due} cards due` : "no cards due — keep going"}
            </div>
            <div style={{ color: c.muted, fontSize: 11 }}>
              {stats.mastered} mastered · {stats.learning} learning · {stats.fresh} fresh
            </div>
          </div>
          <div style={{ minWidth: 90 }}>
            <Btn size="sm" variant={stats.due > 0 ? "accent" : "ghost"} onClick={goQuiz}>
              ▷ quiz
            </Btn>
          </div>
        </div>
      </Section>

      {lastSession && (
        <Section title="LAST PLAY">
          <div style={{ padding: "12px 14px", border: `1px solid ${c.border}`, background: c.panel }}>
            <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2 }}>
              {lastSession.date} · {lastSession.focus} · {lastSession.minutes}m
            </div>
          </div>
        </Section>
      )}

      <Section title="QUICK TOOLS" mt={18}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Btn size="sm" onClick={goLibrary}>♪ chords</Btn>
          <Btn size="sm" onClick={goLibrary}>≡ tabs</Btn>
        </div>
      </Section>
    </div>
  );
}
