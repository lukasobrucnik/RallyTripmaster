# RallyTrip

A GPS tripmeter app for rally co-drivers, built as a React + Vite web app packaged with Capacitor for Android. Designed to be read at a glance while driving: big numbers, simple gestures, no scrolling.

It is styled as a precision field instrument rather than a sports brand — the number is the interface, and colour is reserved for state. The strategy behind that lives in [PRODUCT.md](PRODUCT.md), the visual system in [DESIGN.md](DESIGN.md).

## Current features

### Trip screen

The main screen, fixed to the viewport (no scrolling), with three elements:

- **Od startu** (from start) and **Od poslední zatáčky** (from last corner) — two large distance readouts sharing one combined touch area.
  - **Tap** anywhere in that area → resets "od poslední zatáčky".
  - **Hold for 1s+** → resets "od startu" (and, with it, "od poslední zatáčky").
- **Current speed** — read-only, GPS-derived, shown smaller below the main area.
- **Pause/Resume** button next to the speed — freezes distance accumulation without losing GPS lock. While paused, a diagonal caution band appears on the data frame and a flag shows in the status strip, so the state is never carried by colour alone.
- **Manual correction buttons** (`-step` / `± custom` / `+step`):
  - Short press corrects only "od poslední zatáčky".
  - Hold 1s+ corrects everything at once (total/trip A/trip B/partial) — meant for calibrating before the start.
- Hold gestures draw a progress rule along the bottom edge of the zone being held, so a long press is never a guess.
- Layout adapts to landscape orientation (values go side-by-side) and the numerals size themselves from the field they sit in, so they fill the frame on any screen without media queries.

### RZ screen (special stage stopwatch)

Start/stop/split stopwatch for timing a stage, independent of the trip odometer, with running distance, average speed, and max speed for the stage. Splits are listed as a ruled time card. Clearing the stage requires a deliberate hold, so a stage time can't be wiped by a stray gloved touch.

### Settings screen

Grouped into measurement, display, and in-car panels:

- **Measurement** — GPS distance calibration coefficient, accuracy limit (which fixes count), manual-correction step size, decimal places for the main readout.
- **Display** — units (metric/imperial), mode (Cockpit / Daylight), bigger touch targets for gloved hands.
- **In-car** — keep screen awake, haptics, speed limit warning (0 disables it, for recce runs).

## GPS handling

- Uses the standard `navigator.geolocation.watchPosition` API with `enableHighAccuracy: true` and `maximumAge: 0`.
- Fixes worse than a configurable accuracy threshold (default 25 m) are ignored for distance integration but still shown as "weak signal" — kept loose on purpose, since a strict filter would stop measuring too often under tree cover or near buildings, which is common on rally stages.
- Distance per fix is the average of a haversine position delta and a speed-integrated delta, which empirically reduces error on winding roads.
- Implausible jumps (>~340 km/h implied speed) are discarded as GPS glitches.
- Below a stationary-speed threshold, no distance is accumulated (suppresses GPS drift while parked).
- After a cold start, a permission grant, or a signal gap, the first couple of fixes are used only to re-settle position before distance starts counting again.
- Real-world accuracy is hardware-limited (phone GPS typically reports 5–15 m in a car); no amount of filtering can turn that into sub-5 m accuracy without an external RTK/GNSS receiver.

## Tech stack

- [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) 6
- [Capacitor](https://capacitorjs.com/) 6 for the native Android shell (`@capacitor/geolocation`, `@capacitor/splash-screen`)
- Plain CSS, no framework — OKLCH design tokens in `src/styles.css`, container queries for the readouts
- [Archivo](https://fonts.google.com/specimen/Archivo) as a self-hosted variable font (`src/fonts/`), weight and width axes, latin + latin-ext for Czech diacritics. Self-hosted rather than CDN-linked because the app has to work with no signal at all.
- `vite-plugin-mkcert` for local HTTPS in development (see below)
- `localStorage`-backed persistence for trip counters and settings (`src/lib/storage.js`)

## Getting started

```bash
npm install
npm run dev
```

This starts a Vite dev server over **HTTPS** (via `vite-plugin-mkcert`) on `https://localhost:5173` and on your LAN IP (e.g. `https://192.168.x.x:5173`), so you can open it from a phone on the same Wi-Fi.

HTTPS matters here: `navigator.geolocation` only works in a "secure context" (HTTPS or `localhost`). Opening the dev server over plain `http://<lan-ip>` will make the browser silently deny location access. On first visit to the LAN HTTPS URL from a phone, you'll see a certificate warning (the mkcert certificate is only trusted on the machine running the dev server) — accept/proceed past it once, and the browser will then prompt normally for location permission.

## Building for Android (sideload, no Play Store)

Requires Android Studio (for its bundled JDK) and the Android SDK installed locally.

```bash
npm run build
npx cap sync android      # first time: npx cap add android
cd android
./gradlew assembleDebug
```

The debug APK is produced at `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to the phone and install it directly (you'll need to allow "install unknown apps" once for whichever app you use to open the file). This is a debug build — fine for personal use, but not signed for distribution through an app store.

Note: `android/` and `ios/` are git-ignored and regenerated with `npx cap add android` / `npx cap add ios` — they aren't committed to this repo.

## Project structure

```
PRODUCT.md             who it's for, what it's for, design principles
DESIGN.md              visual system: tokens, typography, form language, motion
src/
  App.jsx              tab shell, GPS status strip, wake-lock handling
  main.jsx             provider setup (Settings, Trip, Notes) + root render
  styles.css           design tokens and all component/screen styles
  fonts/               self-hosted Archivo variable font (latin, latin-ext)
  lib/
    trip.jsx           GPS watch, distance/speed state, stage stopwatch, trip actions
    settings.jsx       user settings state + persistence + theme application
    notes.jsx          stage-notes data model (not currently wired into a screen)
    geo.js             formatting + geodesic helpers (haversine, units, clock format)
    storage.js         localStorage read/write helpers
  components/ui.jsx    UI primitives (Sheet, Seg, Setting, Toggle, NumberSheet,
                       HoldButton, PressArea) sharing one press-gesture hook
  screens/
    TripScreen.jsx     main odometer screen
    StageScreen.jsx    RZ stopwatch
    SettingsScreen.jsx settings panels
```

## Status

Early, actively developed. `NotesScreen` and `TsdScreen` (stage notes / time-speed-distance) existed in an earlier iteration and were removed from the tab bar to focus on Trip/RZ/Settings first — `src/lib/notes.jsx` still has the notes data model for when that screen comes back.
