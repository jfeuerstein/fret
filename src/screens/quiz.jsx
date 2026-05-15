// quiz.jsx — full quiz mode. spaced-repetition deck of barre chords,
// fretboard notes, intervals, chord functions, modes, key sigs, etc.
//
// the small "theory" block in a daily session embeds a 5-card slice
// of the same deck (see screens/session.jsx → InlineQuiz).

import { useMemo, useState } from "react";
import { Store, useStore } from "../store.js";
import { PRACTICE_LABELS, TAG_LABELS, TAG_PRACTICE, generateDeck } from "../quiz/cards.js";
import { deckStats, newCard, pickQueue, review } from "../quiz/srs.js";
import { Btn, Header, Mini, Section } from "../components/atoms.jsx";
import { baseFont, c, screenStyle } from "../theme.js";

const CHIP = (active, accent) => ({
  background: active ? (accent || c.fg) : "transparent",
  color: active ? c.bg : c.fg,
  border: `1px solid ${active ? (accent || c.fg) : c.border}`,
  padding: "8px 12px",
  font: "inherit",
  fontFamily: baseFont,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  cursor: "pointer",
  whiteSpace: "nowrap",
});

export function QuizScreen() {
  const progress = useStore((s) => s.quiz);
  const deck = useMemo(() => generateDeck(), []);

  // practice: "all" | "guitar" | "mental"
  // tag:      "all" | "barre" | "fretboard" | "intervals" | ...
  const [practice, setPractice] = useState("all");
  const [tag, setTag] = useState("all");
  const [mode, setMode] = useState("menu");

  const practiceDeck = useMemo(() => (
    practice === "all"
      ? deck
      : deck.filter((c) => TAG_PRACTICE[c.tag] === practice)
  ), [deck, practice]);

  // a tag selected in a previous practice mode might no longer be visible —
  // reset it to "all" if so.
  const visibleTags = useMemo(() => {
    const set = new Set(practiceDeck.map((c) => c.tag));
    return Object.keys(TAG_LABELS).filter((t) => set.has(t));
  }, [practiceDeck]);
  const effectiveTag = visibleTags.includes(tag) ? tag : "all";

  const filtered = effectiveTag === "all"
    ? practiceDeck
    : practiceDeck.filter((c) => c.tag === effectiveTag);
  const stats = deckStats(filtered, progress);

  if (mode === "playing") {
    return <QuizPlayer deck={filtered} onExit={() => setMode("menu")} />;
  }

  const tagDue = (t) => deckStats(deck.filter((c) => c.tag === t), progress).due;

  // top-level practice mode counts
  const guitarStats = deckStats(deck.filter((c) => TAG_PRACTICE[c.tag] === "guitar"), progress);
  const mentalStats = deckStats(deck.filter((c) => TAG_PRACTICE[c.tag] === "mental"), progress);

  return (
    <div style={screenStyle}>
      <Header left="THEORY · QUIZ DECK" right={`${stats.due} DUE`} />
      <div style={{ fontSize: 22, marginBottom: 6 }}>quiz</div>
      <div style={{ color: c.dim, fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
        spaced repetition for the things you need cold to jam.
      </div>

      <Section title="PRACTICE MODE" mt={4}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <ModeTile
            active={practice === "all"}
            onClick={() => setPractice("all")}
            label="all"
            sub={`${deck.length} cards`}
          />
          <ModeTile
            active={practice === "guitar"}
            onClick={() => setPractice("guitar")}
            label="🎸 with guitar"
            sub={`${guitarStats.due} due · ${guitarStats.total} cards`}
          />
          <ModeTile
            active={practice === "mental"}
            onClick={() => setPractice("mental")}
            label="🧠 mental"
            sub={`${mentalStats.due} due · ${mentalStats.total} cards`}
          />
        </div>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 18, marginBottom: 8 }}>
        <Mini label="DUE"       value={stats.due}       accent />
        <Mini label="LEARNING"  value={stats.learning} />
        <Mini label="MASTERED"  value={stats.mastered} />
        <Mini label="FRESH"     value={stats.fresh} />
      </div>

      <Section title="CATEGORY">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button onClick={() => setTag("all")} style={CHIP(effectiveTag === "all", c.amber)}>
            all · {practiceDeck.length}
          </button>
          {visibleTags.map((key) => {
            const due = tagDue(key);
            return (
              <button
                key={key}
                onClick={() => setTag(key)}
                style={CHIP(effectiveTag === key, due > 0 ? c.amber : null)}
              >
                {TAG_LABELS[key]} · {due > 0 ? `${due} due` : deck.filter((c) => c.tag === key).length}
              </button>
            );
          })}
        </div>
      </Section>

      <div style={{ marginTop: 22 }}>
        <Btn variant="solid" size="lg" onClick={() => setMode("playing")}>
          {stats.due > 0
            ? `▷ start · ${stats.due} due`
            : `▷ start · ${Math.min(20, stats.fresh)} fresh cards`}
        </Btn>
      </div>

      <Section title="HOW THIS WORKS" mt={22}>
        <div style={{ color: c.dim, fontSize: 12, lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px" }}>
            grade each card honestly. <span style={{ color: c.red }}>again</span> shows it
            in 1 minute. <span style={{ color: c.amber }}>hard</span>,
            <span style={{ color: c.green }}> good</span>,
            <span style={{ color: c.amber }}> easy</span> increase the gap (1d → 3d → 7d → ...).
          </p>
          <p style={{ margin: 0 }}>
            cards you've mastered (interval ≥ 21d) stop crowding the queue.
            new cards are dripped in after the due ones are cleared.
          </p>
        </div>
      </Section>

      <div style={{ marginTop: 18 }}>
        <Btn size="sm" variant="danger" onClick={() => {
          if (confirm("reset all quiz progress?")) Store.resetQuiz();
        }}>
          ↺ reset progress
        </Btn>
      </div>
    </div>
  );
}

function QuizPlayer({ deck, onExit }) {
  const progress = useStore((s) => s.quiz);
  const [queue] = useState(() => pickQueue(deck, progress, 20));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ good: 0, again: 0 });

  const card = queue[idx];

  if (!card) return (
    <div style={{ padding: "44px 16px", textAlign: "center", color: c.muted, fontFamily: baseFont }}>
      <div style={{ fontSize: 16, color: c.fg, marginBottom: 12 }}>nothing to quiz here.</div>
      <div style={{ marginBottom: 18 }}>nothing's due in this category.</div>
      <Btn onClick={onExit}>← back</Btn>
    </div>
  );

  const grade = (g) => {
    const next = review(progress[card.id] || newCard(), g);
    Store.updateQuizCard(card.id, next);
    setTally((t) => ({
      good: t.good + (g === "again" ? 0 : 1),
      again: t.again + (g === "again" ? 1 : 0),
    }));
    setPicked(null);
    setRevealed(false);
    if (idx + 1 >= queue.length) onExit();
    else setIdx(idx + 1);
  };

  const isCorrect = picked && picked === card.answer;

  return (
    <div style={screenStyle}>
      <Header
        left={`QUIZ · ${idx + 1}/${queue.length}`}
        right={`✓ ${tally.good} · ↻ ${tally.again}`}
      />

      {/* progress bar */}
      <div style={{ height: 3, background: c.faint, marginBottom: 18 }}>
        <div style={{ height: "100%", width: `${((idx) / queue.length) * 100}%`, background: c.amber, transition: "width 0.2s" }} />
      </div>

      <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2, marginBottom: 6 }}>
        {TAG_LABELS[card.tag] || card.tag}
        <span style={{ marginLeft: 8, color: TAG_PRACTICE[card.tag] === "guitar" ? c.amber : c.dim }}>
          · {TAG_PRACTICE[card.tag] === "guitar" ? "🎸" : "🧠"} {PRACTICE_LABELS[TAG_PRACTICE[card.tag]]}
        </span>
      </div>
      <div style={{ fontSize: 22, lineHeight: 1.3, marginBottom: 18 }}>{card.prompt}</div>

      {card.kind === "mc" ? (
        <McChoices
          choices={card.choices}
          answer={card.answer}
          picked={picked}
          onPick={setPicked}
        />
      ) : (
        <RevealAnswer card={card} revealed={revealed} setRevealed={setRevealed} />
      )}

      <div style={{ marginTop: 20 }}>
        {card.kind === "mc" && picked && (
          isCorrect ? (
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" variant="ghost"   onClick={() => grade("hard")}>hard</Btn>
              <Btn size="sm" variant="success" onClick={() => grade("good")}>good</Btn>
              <Btn size="sm" variant="accent"  onClick={() => grade("easy")}>easy</Btn>
            </div>
          ) : (
            <Btn variant="danger" onClick={() => grade("again")}>again</Btn>
          )
        )}

        {card.kind === "reveal" && revealed && (
          <div style={{ display: "flex", gap: 6 }}>
            <Btn size="sm" variant="danger"  onClick={() => grade("again")}>again</Btn>
            <Btn size="sm" variant="ghost"   onClick={() => grade("hard")}>hard</Btn>
            <Btn size="sm" variant="success" onClick={() => grade("good")}>good</Btn>
            <Btn size="sm" variant="accent"  onClick={() => grade("easy")}>easy</Btn>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <Btn size="sm" onClick={onExit}>← exit quiz</Btn>
      </div>
    </div>
  );
}

function McChoices({ choices, answer, picked, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {choices.map((opt) => {
        const isPicked = picked === opt;
        const isAns = opt === answer;
        const showColor = picked && (isPicked || isAns);
        return (
          <button
            key={opt}
            onClick={() => !picked && onPick(opt)}
            disabled={!!picked}
            style={{
              padding: "16px 10px",
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
              fontSize: 16,
              cursor: picked ? "default" : "pointer",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ModeTile({ active, onClick, label, sub }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? c.panel : "transparent",
        color: active ? c.amber : c.fg,
        border: `1px solid ${active ? c.amber : c.border}`,
        padding: "12px 8px",
        font: "inherit",
        fontFamily: baseFont,
        cursor: "pointer",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 13, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 10, color: c.muted, letterSpacing: 1 }}>{sub}</div>
    </button>
  );
}

function RevealAnswer({ card, revealed, setRevealed }) {
  if (!revealed) {
    return <Btn variant="solid" onClick={() => setRevealed(true)}>reveal answer</Btn>;
  }
  return (
    <div style={{
      padding: "14px 16px",
      border: `1px dashed ${c.border}`,
      background: c.panel,
      color: c.fg,
      fontSize: 14,
      lineHeight: 1.5,
    }}>
      {card.answer}
    </div>
  );
}
