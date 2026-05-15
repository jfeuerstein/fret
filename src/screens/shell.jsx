// shell.jsx — tab bar + screen router. assumes profile is already set.
// 4 top-level tabs: today / week / quiz / more. play and overflow tools
// live one tap deeper to keep touch targets large on mobile.

import { useEffect, useState } from "react";
import { Store, useStore } from "../store.js";
import { generateWeek } from "../generator.js";
import { baseFont, c } from "../theme.js";
import { HomeScreen } from "./home.jsx";
import { MoreScreen } from "./more.jsx";
import { QuizScreen } from "./quiz.jsx";
import { SessionScreen } from "./session.jsx";
import { WeeklyScreen } from "./weekly.jsx";

const TABS = [
  { id: "home",    label: "today", icon: "◧" },
  { id: "week",    label: "week",  icon: "▦" },
  { id: "quiz",    label: "quiz",  icon: "?" },
  { id: "more",    label: "more",  icon: "≡" },
];

export function Shell() {
  // 'session' is reachable from the home screen's PLAY button, not the tab bar.
  const [tab, setTab] = useState("home");
  const profile = useStore((s) => s.profile);

  useEffect(() => {
    if (!profile) return;
    Store.ensureCurrentWeek((p) =>
      generateWeek({
        daysPerWeek: p.daysPerWeek,
        sessionLength: p.sessionLength,
        focuses: p.focuses,
      }),
    );
  }, [profile]);

  // when you tap a different tab, you almost never want to land where the
  // last screen left off scrolling. snap to top.
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, [tab]);

  let screen;
  switch (tab) {
    case "session": screen = <SessionScreen onComplete={() => setTab("home")} />; break;
    case "week":    screen = <WeeklyScreen />; break;
    case "quiz":    screen = <QuizScreen />; break;
    case "more":    screen = <MoreScreen />; break;
    default:
      screen = <HomeScreen
        goSession={() => setTab("session")}
        goLibrary={() => setTab("more")}
        goQuiz={() => setTab("quiz")}
      />;
  }

  // hide the bottom bar during an in-progress session so it doesn't
  // compete with the transport controls.
  const showTabs = tab !== "session";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      background: c.bg,
    }}>
      <div style={{ flex: 1 }}>{screen}</div>
      {showTabs && <TabBar tab={tab} setTab={setTab} />}
    </div>
  );
}

function TabBar({ tab, setTab }) {
  return (
    <div style={{
      position: "sticky",
      bottom: 0,
      background: c.bg,
      borderTop: `1px solid ${c.border}`,
      paddingTop: 6,
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
      paddingLeft: 6,
      paddingRight: 6,
      display: "flex",
      justifyContent: "space-around",
      zIndex: 30,
    }}>
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              background: active ? c.panel : "transparent",
              border: "none",
              borderRadius: 8,
              padding: "10px 6px",
              minHeight: 56,
              cursor: "pointer",
              color: active ? c.amber : c.dim,
              fontFamily: baseFont,
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
