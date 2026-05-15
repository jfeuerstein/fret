// weekly.jsx — tape rack of the current week. completion lights up green.

import { useMemo, useState } from "react";
import { useStore } from "../store.js";
import { Mini, Reels, Section } from "../components/atoms.jsx";
import { baseFont, c, screenStyle, todayDayKey } from "../theme.js";

export function WeeklyScreen() {
  const w = useStore((s) => s.week?.days) || [];
  const streak = useStore((s) => s.streak);

  const todayKey = todayDayKey();
  const todayIdx = useMemo(
    () => Math.max(0, w.findIndex((d) => d.day === todayKey)),
    [w, todayKey],
  );
  const [selected, setSelected] = useState(todayIdx);
  const sel = w[selected] || w[0];
  const doneCount = w.filter((d) => d.status === "done").length;
  const planned = w.filter((d) => d.status !== "rest").length;

  if (!sel) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: c.muted, fontFamily: baseFont, fontSize: 12 }}>
        no week scheduled.
      </div>
    );
  }

  return (
    <div style={screenStyle}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ color: c.muted, fontSize: 10, letterSpacing: 3 }}>TAPE RACK</div>
        <div style={{ fontSize: 22, marginTop: 4 }}>this week</div>
      </div>
      <div style={{ display: "flex", gap: 10, color: c.muted, fontSize: 11, marginBottom: 18 }}>
        <span>{doneCount}/{planned} played</span>
        <span style={{ color: c.faint }}>·</span>
        <span>{streak.totalMinutes}m total</span>
        <span style={{ color: c.faint }}>·</span>
        <span style={{ color: c.amber }}>★ {streak.count}d</span>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 18 }}>
        {w.map((d, i) => {
          const isSel = i === selected;
          const isDone = d.status === "done";
          const isToday = i === todayIdx;
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
                opacity: isRest ? 0.45 : 1,
                transition: "all 0.15s",
              }}
            >
              <div style={{ color: isToday ? c.amber : c.muted, fontSize: 9, letterSpacing: 1.5 }}>
                {d.day.toUpperCase()}
              </div>
              <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "4px 0" }}>
                {isRest ? <span style={{ color: c.muted, fontSize: 16 }}>—</span>
                        : <Reels size={18} spinning={isToday && !isDone} />}
              </div>
              <div style={{
                fontSize: 10,
                color: isDone ? c.green : isToday ? c.amber : c.muted,
              }}>
                {isDone ? "✓" : isToday ? "▷" : isRest ? "—" : "○"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ border: `1.5px solid ${c.fg}`, padding: "14px 16px", marginBottom: 14, background: c.panel }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ color: c.muted, fontSize: 10, letterSpacing: 2 }}>{sel.day.toUpperCase()}</div>
          <div style={{
            color:
              sel.status === "done" ? c.green
              : selected === todayIdx ? c.amber
              : c.muted,
            fontSize: 10,
            letterSpacing: 2,
          }}>
            {sel.status === "done" ? "✓ PLAYED"
              : selected === todayIdx ? "▷ ON DECK"
              : sel.status === "rest" ? "— REST"
              : "QUEUED"}
          </div>
        </div>
        <div style={{ fontSize: 22, textTransform: "uppercase", letterSpacing: 1 }}>
          {sel.status === "rest" ? "rest day" : sel.focus}
        </div>
        <div style={{ color: c.dim, fontSize: 13, marginTop: 4 }}>{sel.short}</div>
        {sel.status !== "rest" && (
          <div style={{
            display: "flex", justifyContent: "space-between",
            marginTop: 14, borderTop: `1px dashed ${c.border}`, paddingTop: 10,
          }}>
            <Mini label="DURATION" value={`${sel.minutes}m`} />
            <Mini label="STATUS" value={sel.status.toUpperCase()} />
            <Mini label="PEAK BPM" value={sel.bpm ? String(sel.bpm).padStart(3, "0") : "—"} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
        <Mini label="STREAK" value={`${streak.count}d`} accent />
        <Mini label="WEEK" value={`${streak.totalMinutes}m`} />
        <Mini label="ALL-TIME" value={`${streak.totalAllTime}m`} />
      </div>

      <Section title="JOURNAL" mt={20}>
        <div style={{ color: c.muted, fontSize: 11, fontStyle: "italic" }}>
          (tap "log" tab for entries)
        </div>
      </Section>
    </div>
  );
}
