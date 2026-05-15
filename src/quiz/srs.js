// srs.js — minimal SM-2 spaced repetition.
// state per card: { ease, interval (days), reps, dueAt (ms epoch), lapses }

const DAY = 86_400_000;

export function newCard() {
  return { ease: 2.5, interval: 0, reps: 0, dueAt: Date.now(), lapses: 0 };
}

// grade: "again" | "hard" | "good" | "easy"
export function review(card, grade, now = Date.now()) {
  const c = { ...(card || newCard()) };

  if (grade === "again") {
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.interval = 0;
    c.reps = 0;
    c.lapses += 1;
    c.dueAt = now + 60_000; // see again in ~1 min
    return c;
  }

  if (c.reps === 0) c.interval = grade === "easy" ? 4 : 1;
  else if (c.reps === 1) c.interval = grade === "easy" ? 6 : 3;
  else {
    const mult =
      grade === "hard" ? 1.2
      : grade === "easy" ? c.ease * 1.3
      : c.ease;
    c.interval = Math.max(1, Math.round(c.interval * mult));
  }
  c.reps += 1;
  if (grade === "easy") c.ease = Math.min(3.0, c.ease + 0.15);
  if (grade === "hard") c.ease = Math.max(1.3, c.ease - 0.15);
  c.dueAt = now + c.interval * DAY;
  return c;
}

export function isDue(card, now = Date.now()) {
  if (!card) return true; // unseen
  return card.dueAt <= now;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickQueue(deck, progress, max = Infinity, now = Date.now()) {
  const due = [];
  const fresh = [];
  for (const card of deck) {
    const p = progress[card.id];
    if (!p) fresh.push(card);
    else if (p.dueAt <= now) due.push(card);
  }
  // due first (still prioritized), but order is random within each group
  // so consecutive sessions don't drill the same cards in the same sequence.
  const queue = shuffle(due).concat(shuffle(fresh));
  return queue.slice(0, max);
}

// summary stats for the home screen
export function deckStats(deck, progress, now = Date.now()) {
  let due = 0, learning = 0, mastered = 0, fresh = 0;
  for (const card of deck) {
    const p = progress[card.id];
    if (!p) { fresh++; continue; }
    if (p.dueAt <= now) due++;
    else if (p.interval >= 21) mastered++;
    else learning++;
  }
  return { total: deck.length, due, fresh, learning, mastered };
}
