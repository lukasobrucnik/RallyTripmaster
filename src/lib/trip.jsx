import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { haversine } from './geo.js';
import { load, save } from './storage.js';
import { useSettings } from './settings.jsx';

const Ctx = createContext(null);

const MAX_PLAUSIBLE_MPS = 95; // ~340 km/h - nad tim je to skok GPS, ne jizda
const MAX_GAP_S = 12;         // delsi diru v signalu uz neintegrujeme
const SETTLE_FIXES = 2;       // po studenem startu/vypadku tolik fixu jen ustaluje polohu, nepocita se

const emptyStage = () => ({ running: false, startedAt: 0, accumMs: 0, dist: 0, splits: [], maxSpeed: 0 });

function snapshot(s) {
  const stageMs = s.stage.accumMs + (s.stage.running ? Date.now() - s.stage.startedAt : 0);
  return {
    total: s.total, tripA: s.tripA, tripB: s.tripB, partial: s.partial,
    speed: s.speed, maxSpeed: s.maxSpeed, heading: s.heading,
    accuracy: s.accuracy, lastFixAt: s.lastFixAt, moving: s.moving,
    usable: s.usable, status: s.status, error: s.error, frozen: s.frozen,
    stage: {
      ...s.stage,
      elapsedMs: stageMs,
      avgSpeed: stageMs > 1000 ? s.stage.dist / (stageMs / 1000) : 0,
    },
  };
}

export function TripProvider({ children }) {
  const { settings } = useSettings();
  const setRef = useRef(settings);
  setRef.current = settings;

  // Vsechny citace zijou v refu - GPS chodi jinym tempem, nez chceme prekreslovat.
  const r = useRef({
    prev: null,
    settle: 0, // pocet dalsich fixu, ktere se jen ustaluji, nepocitaji se do vzdalenosti
    total: load('total', 0),
    tripA: load('tripA', 0),
    tripB: load('tripB', 0),
    partial: 0, // od posledniho bodu rozpisu
    speed: 0,
    maxSpeed: 0,
    heading: null,
    accuracy: null,
    lastFixAt: 0,
    moving: false,
    usable: false, // posledni fix prosel filtrem presnosti
    status: 'idle',
    error: null,
    frozen: false,
    stage: emptyStage(),
  });

  const [snap, setSnap] = useState(() => snapshot(r.current));

  // --- prijem polohy -------------------------------------------------------
  const onPosition = useCallback((pos) => {
    const s = r.current;
    const cfg = setRef.current;
    const c = pos.coords;
    const t = pos.timestamp || Date.now();
    const acc = Number.isFinite(c.accuracy) ? c.accuracy : 999;

    s.lastFixAt = t;
    s.accuracy = acc;
    s.error = null;
    if (Number.isFinite(c.heading) && c.speed > 0.5) s.heading = c.heading;

    // Horsi fix nez limit se k mereni nepouzije, ale signal porad mame.
    if (acc > cfg.maxAccuracy) {
      s.usable = false;
      s.status = 'weak';
      s.prev = null; // po navratu presnosti merime od ciste
      s.settle = SETTLE_FIXES;
      return;
    }
    s.usable = true;
    s.status = 'ok';

    const spdRaw = Number.isFinite(c.speed) && c.speed >= 0 ? c.speed : null;
    const fix = { lat: c.latitude, lon: c.longitude, t, spd: spdRaw };
    const prev = s.prev;
    s.prev = fix;
    if (!prev) return;

    const dt = (t - prev.t) / 1000;
    if (dt <= 0 || dt > MAX_GAP_S) return;

    const dRaw = haversine(prev, fix);
    const spd = fix.spd != null ? fix.spd : dRaw / dt;

    if (dRaw / dt > MAX_PLAUSIBLE_MPS) return; // teleport, zahodit

    // Studeny start / navrat signalu: prvnich par fixu jen ustaluje polohu,
    // nez se zacne verit delte mezi nimi.
    if (s.settle > 0) {
      s.settle -= 1;
      s.speed = spd < cfg.stationarySpeed ? 0 : spd;
      return;
    }

    // Stani: GPS i v klidu "chodi" o par metru. Pod prahem nepricitame nic.
    if (spd < cfg.stationarySpeed) {
      s.speed = 0;
      s.moving = false;
      return;
    }

    s.moving = true;
    // Haversine krati oblouky, integrace rychlosti naopak nadhodnocuje sum.
    // Prumer obojiho dava na zatackovych silnicich nejmensi chybu.
    let d = fix.spd != null ? (dRaw + spd * dt) / 2 : dRaw;
    d *= cfg.calibration || 1;

    s.speed = s.speed ? s.speed * 0.4 + spd * 0.6 : spd;
    if (s.speed > s.maxSpeed) s.maxSpeed = s.speed;

    if (!s.frozen) {
      s.total += d;
      s.tripA += d;
      s.tripB += d;
      s.partial += d;
      if (s.stage.running) {
        s.stage.dist += d;
        if (s.speed > s.stage.maxSpeed) s.stage.maxSpeed = s.speed;
      }
    }
  }, []);

  const onError = useCallback((err) => {
    const s = r.current;
    s.status = err.code === 1 ? 'denied' : 'error';
    s.error =
      err.code === 1
        ? 'Pristup k poloze zamitnut - povol ho v nastaveni systemu.'
        : err.code === 2
          ? 'Poloha neni dostupna (slaby signal).'
          : 'GPS neodpovida.';
    s.usable = false;
  }, []);

  // --- watchPosition -------------------------------------------------------
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      r.current.status = 'error';
      r.current.error = 'Zarizeni nema GPS nebo prohlizec nepodporuje geolokaci.';
      return undefined;
    }
    r.current.status = 'waiting';
    const id = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 30000,
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [onPosition, onError]);

  // --- prekreslovani 10x za sekundu ---------------------------------------
  useEffect(() => {
    const id = setInterval(() => {
      const s = r.current;
      // Vypadek signalu delsi nez 5 s bereme jako ztratu fixu.
      if (s.lastFixAt && Date.now() - s.lastFixAt > 5000 && (s.status === 'ok' || s.status === 'weak')) {
        s.status = 'stale';
        s.speed = 0;
        s.moving = false;
        s.prev = null;
        s.settle = SETTLE_FIXES;
      }
      setSnap(snapshot(s));
    }, 100);
    return () => clearInterval(id);
  }, []);

  // --- perzistence ---------------------------------------------------------
  useEffect(() => {
    const persist = () => {
      const s = r.current;
      save('total', s.total);
      save('tripA', s.tripA);
      save('tripB', s.tripB);
    };
    const id = setInterval(persist, 5000);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', persist);
    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', persist);
      persist();
    };
  }, []);

  const buzz = useCallback((ms = 20) => {
    if (setRef.current.haptics && navigator.vibrate) navigator.vibrate(ms);
  }, []);

  // --- akce ----------------------------------------------------------------
  const api = useMemo(
    () => ({
      resetA() { r.current.tripA = 0; r.current.partial = 0; buzz(30); },
      resetB() { r.current.tripB = 0; buzz(30); },
      resetTotal() { r.current.total = 0; buzz(30); },
      resetPartial() { r.current.partial = 0; },
      /** Korekce pouze "od posledni zatacky" - nehne s total/tripA/tripB. */
      nudgePartial(deltaM) {
        const s = r.current;
        s.partial = Math.max(0, s.partial + deltaM);
        buzz(15);
      },
      resetAll() {
        const s = r.current;
        s.total = 0; s.tripA = 0; s.tripB = 0; s.partial = 0; s.maxSpeed = 0;
        s.stage = emptyStage();
        buzz(40);
      },
      /** Rucni korekce - posune vsechny bezici citace o delta metru. */
      nudge(deltaM) {
        const s = r.current;
        s.total = Math.max(0, s.total + deltaM);
        s.tripA = Math.max(0, s.tripA + deltaM);
        s.tripB = Math.max(0, s.tripB + deltaM);
        s.partial = Math.max(0, s.partial + deltaM);
        if (s.stage.running) s.stage.dist = Math.max(0, s.stage.dist + deltaM);
        buzz(15);
      },
      /** Nastavi konkretni citac na zadanou hodnotu v metrech. */
      setCounter(which, meters) {
        const s = r.current;
        const v = Math.max(0, meters);
        if (which === 'tripA') s.tripA = v;
        else if (which === 'tripB') s.tripB = v;
        else if (which === 'total') s.total = v;
        else if (which === 'partial') s.partial = v;
        buzz(15);
      },
      toggleFreeze() { r.current.frozen = !r.current.frozen; buzz(25); },
      resetMaxSpeed() { r.current.maxSpeed = 0; },

      // RZ / stopky
      stageStart() {
        const s = r.current.stage;
        if (s.running) return;
        s.running = true;
        s.startedAt = Date.now();
        buzz(40);
      },
      stageStop() {
        const s = r.current.stage;
        if (!s.running) return;
        s.accumMs += Date.now() - s.startedAt;
        s.running = false;
        buzz(40);
      },
      stageSplit() {
        const s = r.current.stage;
        const ms = s.accumMs + (s.running ? Date.now() - s.startedAt : 0);
        s.splits = [...s.splits, { ms, dist: s.dist, at: Date.now() }];
        buzz(20);
      },
      stageReset() { r.current.stage = emptyStage(); buzz(30); },

      buzz,
    }),
    [buzz]
  );

  const value = useMemo(() => ({ ...snap, ...api }), [snap, api]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTrip mimo TripProvider');
  return v;
}
