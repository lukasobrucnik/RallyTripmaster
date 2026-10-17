import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { load, save } from './storage.js';

export const DEFAULT_SETTINGS = {
  units: 'metric',          // metric | imperial
  theme: 'dark',            // dark | light
  decimals: 2,              // desetinna mista hlavniho odometru
  calibration: 1.0,         // korekcni koeficient GPS drahy
  maxAccuracy: 25,          // m - horsi fix se pro mereni zahodi
  stationarySpeed: 0.7,     // m/s - pod timto se stoji (potlaceni driftu)
  keepAwake: true,          // drzet obrazovku rozsvicenou
  haptics: true,            // vibrace pri markeru / resetu
  bigButtons: true,         // velke ovladaci plochy pro jizdu
  speedLimit: 0,            // km/h, 0 = vypnuto (rezim seznamovacich jizd)
  stepShort: 10,            // m - krok rucni korekce
};

const Ctx = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('settings', {}) }));

  useEffect(() => { save('settings', settings); }, [settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', settings.theme === 'light' ? '#f7f7f8' : '#0a0c0f');
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.dataset.big = settings.bigButtons ? 'true' : 'false';
  }, [settings.bigButtons]);

  const value = useMemo(() => ({
    settings,
    set: (patch) => setSettings((s) => ({ ...s, ...patch })),
    reset: () => setSettings({ ...DEFAULT_SETTINGS }),
  }), [settings]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings mimo SettingsProvider');
  return v;
}
