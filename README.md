# fret · production scaffold

vite + react + service-worker pwa, deployable to vercel with web
push, spaced-rep theory quiz, optional supabase sync.

## quick start

```bash
cd fret-vite
npm install
npm run dev          # localhost:5173
```

## deploy to vercel

```bash
npm i -g vercel
vercel               # link the project
vercel --prod        # ship it
```

## install to homescreen

once on https (vercel gives this free):

- **iOS safari** — share sheet → "add to home screen"
- **android chrome** — auto-prompts, or menu → "install app"
- **desktop chrome** — install icon in url bar

## push notifications

### 1. generate vapid keys (one time)

```bash
npx web-push generate-vapid-keys
```

### 2. set env vars on vercel

| name                    | value                  | scope                     |
| ----------------------- | ---------------------- | ------------------------- |
| `VITE_VAPID_PUBLIC_KEY` | public key (base64url) | production, preview, dev  |
| `VAPID_PRIVATE_KEY`     | private key            | production, preview       |
| `VAPID_SUBJECT`         | mailto:you@example.com | all                       |
| `CRON_SECRET`           | any long random string | production                |

### 3. add storage

vercel dashboard → storage → create kv (upstash redis). it auto-injects
`KV_*` env vars. that's it — `@vercel/kv` reads them at runtime.

### 4. enable reminders

inside the app: settings → 🔔 enable reminders.

### 5. daily cron

`vercel.json` registers a cron at 18:00 UTC daily that hits
`/api/cron-remind`. that route checks `Authorization: Bearer
$CRON_SECRET` (vercel sends this automatically) and fans out a random
nudge to every saved subscription via `web-push` — **skipping anyone
whose `lastPracticed` is today**. tune the time + cadence in
`vercel.json`.

## ios push gotcha

apple only delivers web push to PWAs the user has **added to their
homescreen first** (iOS 16.4+). regular safari tabs don't get push.

## quiz mode

`/quiz` tab. spaced-repetition (SM-2) deck of:

- **barre chords** — E-shape and A-shape · maj/min/7 in all 12 roots
- **fretboard notes** — 12 frets × 6 strings
- **intervals** — m3 / M3 / 4 / tri / 5 / m7 / M7 above any root
- **chord functions** — diatonic I/ii/iii/IV/V/vi in 6 common keys
- **modes** — best mode over major7 / min7 / dom7 / half-dim
- **key signatures** — sharp count

cards are graded `again / hard / good / easy`. progress lives in
`store.js` under `state.quiz`. the daily session also includes a
5-card "theory" block that pulls from due cards first.

## sync (optional)

local-first. to enable cloud sync across devices:

```bash
npm i @supabase/supabase-js
```

then set:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

and create the table:

```sql
create table fret_state (
  user_id text primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);
alter table fret_state enable row level security;
create policy "owner" on fret_state for all
  using (auth.uid()::text = user_id);
```

`src/sync.js` will dynamic-import the SDK, pull on init, and
debounce-push on local changes. for v1 the row key is the local
`clientId` — wire `supabase.auth` to attach devices to real accounts.

## file map

```
src/
  App.jsx               profile gate → onboarding | shell
  main.jsx              entrypoint
  theme.js              color tokens, font, date helpers
  store.js              localStorage + useStore() + week rotation
  generator.js          deterministic-by-day session/week builder
  audio.js              metronome + tuner + drone (web audio)
  content.js            re-exports json content + helpers
  usePush.js            push subscribe/unsubscribe + markPracticed()
  sync.js               opt-in supabase adapter (no-op without env)
  sw.js                 service worker (precache + push handler)

  content/              static data (drills, tabs, backing, chords)
  quiz/
    srs.js              SM-2 review/queue/stats
    cards.js            deck generator (barre/intervals/funcs/...)

  components/
    atoms.jsx           Btn, Header, Section, Mini, Reels
    wireframe.jsx       svg art (cassette, orb, headstock, chord diagram)
    ios-frame.jsx       device chrome (unused; for marketing shots)

  screens/
    onboarding.jsx
    shell.jsx           tab bar + screen router; auto-rotates the week
    home.jsx            today's tape + due-quiz callout
    session.jsx         play screen with metronome + adaptive bpm
    weekly.jsx          tape rack of the current week
    quiz.jsx            full quiz mode (categories + player)
    journal.jsx
    tuner.jsx
    library.jsx
    settings.jsx        push, sync status, reset

api/
  _lib.js               readJson() + subKey() + todayUtcKey()
  subscribe.js          POST/DELETE — store push subs in kv
  practiced.js          POST — client pings on session complete
  cron-remind.js        daily fan-out, skips subs that practiced today
```

## env example

```
cp .env.example .env.local
# fill in vapid keys for local push testing
```

## roadmap

- supabase **auth** (currently anonymous-clientId rows)
- migrate `kv` → vercel postgres when sharing/social lands
- `@supabase/supabase-js` install + a real "log in" flow
- ear-training cards (interval recognition by sound)
- exposed bpm history graph per drill
