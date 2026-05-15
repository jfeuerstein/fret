# fret · production scaffold

vite + react + service-worker pwa, deployable to vercel with
web push.

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

GitHub integration (recommended): import the repo at
vercel.com → every push to `main` auto-deploys, branches get
preview URLs.

## install to homescreen

once on https (vercel gives this free):

- **iOS safari** — share sheet → "add to home screen"
- **android chrome** — auto-prompts, or menu → "install app"
- **desktop chrome** — install icon in url bar, or trigger
  via `beforeinstallprompt`

the manifest, icons, and service worker are already wired by
`vite-plugin-pwa`.

## push notifications

### 1. generate vapid keys (one time)

```bash
npx web-push generate-vapid-keys
```

copy both keys.

### 2. set env vars on vercel

dashboard → project → settings → environment variables:

| name                    | value                  | scope                    |
| ----------------------- | ---------------------- | ------------------------ |
| `VITE_VAPID_PUBLIC_KEY` | public key (base64url) | production, preview, dev |
| `VAPID_PRIVATE_KEY`     | private key            | production, preview      |
| `VAPID_SUBJECT`         | mailto:you@example.com | all                      |

> the `VITE_` prefix exposes a var to the client bundle.
> **never** prefix the private key.

### 3. add storage

vercel dashboard → storage → create kv (upstash redis). it
auto-injects `KV_*` env vars. that's it — `@vercel/kv` reads
them at runtime.

### 4. enable reminders

the in-app "🔔 enable reminders" button calls
`usePush().subscribe()`, which:

- requests permission
- subscribes via `pushManager.subscribe`
- POSTs the subscription to `/api/subscribe`

### 5. daily cron

`vercel.json` registers a cron at 18:00 UTC daily that hits
`/api/cron-remind`. that route fans out a random nudge to
every saved subscription via `web-push`. tune the time +
cadence there.

## ios push gotcha

apple only delivers web push to PWAs that the user has
**added to their homescreen first** (iOS 16.4+). regular
safari tabs don't get push. android & desktop work either
way.

## file map

```
src/
  main.jsx              app entrypoint
  App.jsx               minimal runnable shell (port the full prototype here)
  store.js              localStorage + useStore() hook
  generator.js          rules-based session/week builder
  content.js            chord/scale/tab/backing library
  audio.js              metronome + tuner + drone
  usePush.js            push subscription hook
  sw.js                 service worker (precache + push handler)
api/
  subscribe.js          POST/DELETE — store push subs in kv
  cron-remind.js        daily fan-out via web-push
public/
  icon.svg              app + notification icon
vite.config.js          react + vite-plugin-pwa (injectManifest)
vercel.json             cron schedule
```

## porting the prototype ui

the parent folder has the full prototype (tape, session,
tuner, library, week, journal). to bring those screens in:

1. copy `tape.jsx`, `screens.jsx`, `wireframe.jsx`,
   `ios-frame.jsx` → `src/components/`
2. for each file, replace:
   - `const { useState, useEffect } = React;` →
     `import { useState, useEffect } from 'react';`
   - `window.Store` → `import { Store } from '../store.js';`
   - `window.Routine.generateSession(...)` →
     `import { generateSession } from '../generator.js';`
   - `window.CHORDS / TABS / BACKING / GUITAR_STRINGS` →
     `import { CHORDS, TABS, BACKING, GUITAR_STRINGS } from '../content.js';`
   - `window.audio.metronome / tuner / drone` →
     `import { metronome, tuner, drone } from '../audio.js';`
   - `window.fmtTime / freqToNote` →
     `import { fmtTime, freqToNote } from '../content.js';`
   - the bottom `window.TapeApp = TapeApp;` line →
     `export { TapeApp };`
3. swap `App.jsx` to render `<TapeApp/>` instead of the demo
   `<Today/>`.

the audio + state APIs in `src/` are 1:1 with the originals
— only the access pattern changes.

## env example

```
cp .env.example .env.local
# fill in vapid keys for local push testing
```

## roadmap

- auth (clerk or supabase) → sync across devices
- sentry for error tracking
- migrate kv → vercel postgres when sharing/social lands
- expo react native shell that reuses store + generator +
  content
