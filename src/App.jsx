import { useEffect, useState } from 'react';
import { useSettings } from './lib/settings.jsx';
import { useTrip } from './lib/trip.jsx';
import { toSpeed, speedUnit } from './lib/geo.js';
import TripScreen from './screens/TripScreen.jsx';
import StageScreen from './screens/StageScreen.jsx';
import SettingsScreen from './screens/SettingsScreen.jsx';

const TABS = [
  { id: 'trip', label: 'Trip', ico: '⟲', Screen: TripScreen },
  { id: 'stage', label: 'RZ', ico: '⏱', Screen: StageScreen },
  { id: 'set', label: 'Nastaveni', ico: '⚙', Screen: SettingsScreen },
];

const STATUS_TEXT = {
  idle: ['', 'Start...'],
  waiting: ['pulse', 'Hledam satelity'],
  ok: ['ok', 'GPS'],
  weak: ['weak', 'Slaby signal'],
  stale: ['bad', 'Ztracen fix'],
  denied: ['bad', 'Poloha zakazana'],
  error: ['bad', 'Chyba GPS'],
};

function StatusBar() {
  const { settings } = useSettings();
  const trip = useTrip();
  const [cls, text] = STATUS_TEXT[trip.status] || STATUS_TEXT.idle;
  const kmh = toSpeed(trip.speed, settings.units);
  const over = settings.speedLimit > 0 && kmh > settings.speedLimit + 1;

  return (
    <div className="status">
      <span className={`dot ${cls}`} />
      <span>{text}</span>
      {trip.accuracy != null && <span className="num">±{Math.round(trip.accuracy)} m</span>}
      <span className="grow" />
      {trip.frozen && <span className="freeze-flag">PAUZA</span>}
      <span className={`num ${over ? 'bad' : ''}`}>
        <b>{kmh.toFixed(0)}</b> {speedUnit(settings.units)}
      </span>
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
      <StatusBar />
      <div className="main">
        <Screen go={setTab} />
      </div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <span className="ico">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
