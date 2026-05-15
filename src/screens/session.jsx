// session.jsx — the actual practice screen.
// metronome + tape progress + per-block transport. records BPM on
// "clean" completion so the generator's adaptive ramp has data.
// blocks of kind 'quiz' get an inline 5-card quiz drawer instead.

import { useEffect, useMemo, useState } from "react";
import { Store, useStore } from "../store.js";
import { BACKING, TABS, fmtTime } from "../content.js";
import { drone, metronome } from "../audio.js";
import { generateSession } from "../generator.js";
import { generateDeck } from "../quiz/cards.js";
import { newCard, pickQueue, review } from "../quiz/srs.js";
import { Btn, Header, Reels, Section, knobBtn, transport } from "../components/atoms.jsx";
import { markPracticed } from "../usePush.js";
import { baseFont, c, screenStyle, todayDayKey, todayKey } from "../theme.js";

export function SessionScreen({ onComplete }) {
  const profile = useStore((s) => s.profile);
  const history = useStore((s) => s.history);
  const week = useStore((s) => s.week?.days);

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
  }, [profile, focus, history]);

  const [done, setDone] = useState({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [bpm, setBpm] = useState(90);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [beat, setBeat] = useState(-1);
  const [droning, setDroning] = useState(false);

  // sync bpm to whatever the active block wants when session arrives
  useEffect(() => {
    if (session?.blocks?.[0]?.bpm) setBpm(session.blocks[0].bpm);
  }, [session]);

  const block = session?.blocks?.[activeIdx];

  // metronome control
  useEffect(() => {
    if (!block) return;
    if (playing && block.bpm > 0) {
      metronome.start(bpm, (b) => setBeat(b));
    } else {
      metronome.stop();
      setBeat(-1);
    }
    return () => metronome.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, activeIdx, block]);

  useEffect(() => {
    if (playing) metronome.setBpm(bpm);
  }, [bpm, playing]);

  // timer
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setElapsed((x) => x + 1 / 60), 1000);
    return () => clearInterval(id);
  }, [playing]);

  // unmount cleanup
  useEffect(
    () => () => {
      metronome.stop();
      drone.stop();
    },
    [],
  );

  if (!session || !block) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: c.muted, fontFamily: baseFont, fontSize: 12 }}>
        building session...
      </div>
    );
  }

  const pct = Math.min(1, elapsed / Math.max(1, block.duration));
  const remaining = Math.max(0, block.duration - elapsed);

  const advance = () => {
    if (activeIdx < session.blocks.length - 1) {
      const ni = activeIdx + 1;
      setActiveIdx(ni);
      setBpm(session.blocks[ni].bpm || 90);
      setElapsed(0);
      setPlaying(false);
      if (droning) {
        drone.stop();
        setDroning(false);
      }
    } else {
      setPlaying(false);
      Store.completeSession(session, session.duration);
      markPracticed();
      onComplete?.();
    }
  };

  // metronome blocks: clean records bpm + bumps streak; messy records lapse.
  const finishMetronome = (clean) => {
    setDone((d) => ({ ...d, [block.id]: clean ? "clean" : "messy" }));
    if (block.bpm > 0) Store.recordBpm(block.drillId, bpm, !!clean);
    advance();
  };

  // non-metronome (theory/review) blocks
  const finishGeneric = () => {
    setDone((d) => ({ ...d, [block.id]: "done" }));
    advance();
  };

  const togDrone = () => {
    if (droning) { drone.stop(); setDroning(false); }
    else if (block.backing && BACKING[block.backing]) {
      drone.start(BACKING[block.backing]);
      setDroning(true);
    }
  };

  const tabData = block.tab ? TABS[block.tab] : null;
  const isQuizBlock = block.cardKind === "quiz";

  return (
    <div style={screenStyle}>
      <Header left={playing ? "▷ NOW PLAYING" : "⏸ PAUSED"} right="SIDE A" />

      {/* track header */}
      <div style={{ marginBottom: 14, borderBottom: `1px solid ${c.border}`, paddingBottom: 12 }}>
        <div style={{ color: c.muted, fontSize: 11, letterSpacing: 2, marginBottom: 4 }}>
          TRACK {String(activeIdx + 1).padStart(2, "0")} / {String(session.blocks.length).padStart(2, "0")}
          {" · "}<span style={{ color: c.dim }}>{block.kind}</span>
        </div>
        <div style={{ fontSize: 24, textTransform: "uppercase", letterSpacing: 1 }}>{block.label}</div>
        <div style={{ color: c.dim, fontSize: 12, marginTop: 2 }}>{block.drill}</div>
      </div>

      {isQuizBlock ? (
        <InlineQuiz onComplete={finishGeneric} />
      ) : block.bpm > 0 ? (
        <BpmPanel bpm={bpm} setBpm={setBpm} playing={playing} setPlaying={setPlaying} beat={beat} />
      ) : (
        <div style={{ border: `1px dashed ${c.border}`, padding: "20px 16px", marginBottom: 14, textAlign: "center", color: c.muted, fontSize: 12 }}>
          [ no click track — feel it ]
        </div>
      )}

      {/* tape progress (only when there's a real timer) */}
      {!isQuizBlock && (
        <div style={{ background: c.panel, border: `1px solid ${c.border}`, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Reels size={26} spinning={playing} />
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, color: c.muted, marginBottom: 4,
                fontVariantNumeric: "tabular-nums",
              }}>
                <span>{fmtTime(elapsed)}</span>
                <span>−{fmtTime(remaining)}</span>
              </div>
              <div style={{ height: 4, background: c.faint, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: c.fg }} />
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
      )}

      <div style={{ color: c.dim, fontSize: 12, lineHeight: 1.6, padding: "12px 14px", border: `1px solid ${c.border}`, marginBottom: 14 }}>
        <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>NOTES</div>
        {block.detail}
      </div>

      {tabData && (
        <div style={{ border: `1px solid ${c.border}`, padding: "10px 12px", marginBottom: 14, background: c.panel2 }}>
          <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
            TAB · {tabData.name.toUpperCase()}
          </div>
          <pre style={{ margin: 0, fontFamily: baseFont, fontSize: 11, color: c.fg, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre" }}>
            {tabData.lines.join("\n")}
          </pre>
        </div>
      )}

      {block.backing && BACKING[block.backing] && (
        <div style={{ border: `1px solid ${droning ? c.amber : c.border}`, padding: "12px 14px", marginBottom: 14, background: c.panel }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2 }}>BACKING TRACK</div>
            <div style={{ color: droning ? c.amber : c.muted, fontSize: 10, letterSpacing: 2 }}>
              {droning ? "▷ LIVE" : "◌ READY"}
            </div>
          </div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>{BACKING[block.backing].name}</div>
          <div style={{ color: c.dim, fontSize: 11, marginBottom: 6 }}>
            {BACKING[block.backing].chords.join(" / ")}
          </div>
          <Btn size="sm" variant={droning ? "accent" : "ghost"} onClick={togDrone}>
            {droning ? "⏸ stop backing" : "▷ play backing"}
          </Btn>
        </div>
      )}

      {!isQuizBlock && (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button
              onClick={() => activeIdx > 0 && (setActiveIdx(activeIdx - 1), setElapsed(0), setPlaying(false))}
              style={{ ...transport, flex: 1 }}
            >⏮</button>
            <button onClick={advance} style={{ ...transport, flex: 1 }}>⏭</button>
          </div>

          {block.bpm > 0 ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => finishMetronome(false)}
                style={{
                  flex: 1,
                  background: "transparent", color: c.amber,
                  border: `1px solid ${c.amber}`,
                  padding: "14px 0",
                  font: "inherit", fontFamily: baseFont,
                  fontSize: 13, letterSpacing: 2,
                  cursor: "pointer",
                }}
              >△ messy — next</button>
              <button onClick={() => finishMetronome(true)}
                style={{
                  flex: 2,
                  background: c.green, color: c.bg,
                  border: "none",
                  padding: "14px 0",
                  font: "inherit", fontFamily: baseFont,
                  fontSize: 13, letterSpacing: 3,
                  cursor: "pointer",
                }}
              >✓ clean — next</button>
            </div>
          ) : (
            <button onClick={finishGeneric}
              style={{
                width: "100%",
                background: c.green, color: c.bg,
                border: "none",
                padding: "14px 0",
                font: "inherit", fontFamily: baseFont,
                fontSize: 13, letterSpacing: 3,
                cursor: "pointer",
              }}
            >✓ TRACK DONE — NEXT</button>
          )}
        </>
      )}

      <Section title="UP NEXT" mt={20}>
        {session.blocks.map((b, i) => {
          const status = done[b.id];
          const isActive = i === activeIdx;
          return (
            <div key={b.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 0",
              color: isActive ? c.amber : status ? c.muted : c.dim,
              fontSize: 12,
              opacity: status ? 0.6 : 1,
            }}>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ color: c.muted, width: 22 }}>
                  A{String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ textDecoration: status ? "line-through" : "none" }}>
                  {b.label}
                </span>
              </div>
              <span style={{ color: c.muted, fontVariantNumeric: "tabular-nums" }}>
                {String(b.duration).padStart(2, "0")}:00
              </span>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

function BpmPanel({ bpm, setBpm, playing, setPlaying, beat }) {
  return (
    <div style={{ border: `1px solid ${c.border}`, padding: "14px 16px 16px", marginBottom: 14, textAlign: "center" }}>
      <div style={{ color: c.muted, fontSize: 10, letterSpacing: 3, marginBottom: 4 }}>BPM</div>
      <div style={{
        fontSize: 64, lineHeight: 1, letterSpacing: 4, color: c.fg,
        fontVariantNumeric: "tabular-nums",
        textShadow: playing ? `0 0 12px ${c.amber}55` : "none",
        transition: "text-shadow 0.2s",
      }}>
        {String(bpm).padStart(3, "0")}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{
            width: 14, height: 14,
            background: i === beat ? c.amber : c.faint,
            transition: "background 0.05s",
          }} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => setBpm((x) => Math.max(40, x - 5))} style={knobBtn}>−5</button>
        <button onClick={() => setBpm((x) => Math.max(40, x - 1))} style={knobBtn}>−1</button>
        <button onClick={() => setBpm((x) => x + 1)} style={knobBtn}>+1</button>
        <button onClick={() => setBpm((x) => x + 5)} style={knobBtn}>+5</button>
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
  );
}

// ─── inline quiz drawer (theory blocks) ─────────────────────────
function InlineQuiz({ onComplete }) {
  const progress = useStore((s) => s.quiz);
  const deck = useMemo(() => generateDeck(), []);
  const [queue] = useState(() => pickQueue(deck, progress, 5));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState(null);

  const card = queue[idx];

  if (!card) {
    return (
      <div style={{ border: `1px solid ${c.border}`, padding: "20px 16px", marginBottom: 14, textAlign: "center", color: c.muted, fontSize: 12 }}>
        deck empty — nothing due. press ✓ below to continue.
        <div style={{ marginTop: 12 }}>
          <Btn variant="success" onClick={onComplete}>✓ done — next track</Btn>
        </div>
      </div>
    );
  }

  const grade = (g) => {
    const next = review(progress[card.id] || newCard(), g);
    Store.updateQuizCard(card.id, next);
    setRevealed(false);
    setPicked(null);
    if (idx + 1 >= queue.length) onComplete?.();
    else setIdx(idx + 1);
  };

  const isCorrect = picked && picked === card.answer;

  return (
    <div style={{
      border: `1px solid ${c.amber}`, padding: "14px 16px", marginBottom: 14,
      background: c.panel,
    }}>
      <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
        QUIZ · CARD {idx + 1}/{queue.length} · {card.tag}
      </div>
      <div style={{ fontSize: 16, marginBottom: 12 }}>{card.prompt}</div>

      {card.kind === "mc" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            {card.choices.map((opt) => {
              const isPicked = picked === opt;
              const isAns = opt === card.answer;
              const showColor = picked && (isPicked || isAns);
              return (
                <button
                  key={opt}
                  onClick={() => !picked && setPicked(opt)}
                  disabled={!!picked}
                  style={{
                    padding: "12px 10px",
                    background:
                      !showColor ? "transparent"
                      : isAns ? c.green
                      : isPicked ? c.red
                      : "transparent",
                    color: showColor && (isAns || isPicked) ? c.bg : c.fg,
                    border: `1px solid ${
                      !showColor ? c.border
                      : isAns ? c.green
                      : isPicked ? c.red
                      : c.border
                    }`,
                    font: "inherit",
                    fontFamily: baseFont,
                    fontSize: 13,
                    cursor: picked ? "default" : "pointer",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {picked && (
            <div style={{ display: "flex", gap: 6 }}>
              {!isCorrect && (
                <Btn size="sm" variant="danger" onClick={() => grade("again")}>again</Btn>
              )}
              {isCorrect && (
                <>
                  <Btn size="sm" variant="ghost" onClick={() => grade("hard")}>hard</Btn>
                  <Btn size="sm" variant="success" onClick={() => grade("good")}>good</Btn>
                  <Btn size="sm" variant="accent" onClick={() => grade("easy")}>easy</Btn>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {!revealed ? (
            <Btn variant="solid" onClick={() => setRevealed(true)}>reveal answer</Btn>
          ) : (
            <>
              <div style={{ padding: "10px 12px", border: `1px dashed ${c.border}`, marginBottom: 10, color: c.fg }}>
                {card.answer}
                {card.hint && (
                  <div style={{ color: c.muted, fontSize: 11, marginTop: 6, fontStyle: "italic" }}>
                    {card.hint}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" variant="danger" onClick={() => grade("again")}>again</Btn>
                <Btn size="sm" variant="ghost" onClick={() => grade("hard")}>hard</Btn>
                <Btn size="sm" variant="success" onClick={() => grade("good")}>good</Btn>
                <Btn size="sm" variant="accent" onClick={() => grade("easy")}>easy</Btn>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
