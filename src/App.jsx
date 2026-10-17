import { useEffect, useState } from 'react';
import { useSettings } from './lib/settings.jsx';
import { useTrip } from './lib/trip.jsx';
import TripScreen from './screens/TripScreen.jsx';
import StageScreen from './screens/StageScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';

const TABS = [
  { id: 'trip', label: 'Trip', Screen: TripScreen },
  { id: 'stage', label: 'RZ', Screen: StageScreen },
  { id: 'set', label: 'Nastavení', Screen: SettingsScreen },
];

// Stav GPS se hlasi slovem i barvou - samotna barva by vypadla pro
// barvosleheho uzivatele.
const GPS_STATE = {
  idle: [null, 'Čekání'],
  waiting: ['pulse', 'Hledání družic'],
  ok: ['ok', 'GPS'],
  weak: ['weak', 'Slabý signál'],
  stale: ['bad', 'Ztracen fix'],
  denied: ['bad', 'Poloha zakázána'],
  error: ['bad', 'Chyba GPS'],
};

function Strip() {
  const trip = useTrip();
  const [state, label] = GPS_STATE[trip.status] || GPS_STATE.idle;

  return (
    <div className="strip">
      <span className="strip-lamp" data-state={state || undefined} />
      <span>{label}</span>
      <span className="strip-spacer" />
      {trip.accuracy != null && (
        <span className="strip-meta tnum">±{Math.round(trip.accuracy)} m</span>
      )}
      {trip.frozen && <span className="strip-flag">Pauza</span>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('trip');
  const { settings } = useSettings();

  // Displej nesmi za jizdy zhasnout.
  useEffect(() => {
    if (!settings.keepAwake || !('wakeLock' in navigator)) return undefined;
    let lock = null;
    let dead = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* baterie v uspornem rezimu zamek odmitne - nevadi */
      }
    };
    const onVisible = () => {
      if (!dead && document.visibilityState === 'visible') acquire();
    };
    acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      dead = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release?.().catch(() => {});
    };
  }, [settings.keepAwake]);

  const Screen = (TABS.find((t) => t.id === tab) || TABS[0]).Screen;

  return (
    <div className="app">
      <Strip />
      <div className="main">
        <Screen go={setTab} />
      </div>
      <nav className="nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
