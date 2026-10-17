import { useState } from 'react';
import { useSettings } from '../lib/settings.jsx';
import { useTrip } from '../lib/trip.jsx';
import {
  formatDistance, distUnit, shortUnit, toSpeed, speedUnit, M_PER_FOOT,
} from '../lib/geo.js';
import { NumberSheet, HoldButton, PressArea } from '../components/ui.jsx';

/**
 * Kolik "sirek cislice" retezec zabere. Tecka je uzsi nez cislice a za
 * hodnotou jeste stoji jednotka - z toho CSS dopocita velikost pisma tak,
 * aby cislo vyplnilo pole a nikdy nepreteklo.
 */
const charUnits = (s) => s.length - 0.55 * (s.match(/[.,]/g)?.length || 0) + 0.8;

export default function TripScreen() {
  const { settings } = useSettings();
  const t = useTrip();
  const [sheet, setSheet] = useState(null);
  const u = settings.units;

  const shortToMeters = (v) => (u === 'imperial' ? v * M_PER_FOOT : v);
  const startText = formatDistance(t.tripA, u, settings.decimals);
  const partialText = String(Math.round(u === 'imperial' ? t.partial / M_PER_FOOT : t.partial));
  const speed = toSpeed(t.speed, u);
  const over = settings.speedLimit > 0 && speed > settings.speedLimit + 1;
  const step = settings.stepShort;

  return (
    <div className="trip">
      {t.error && (
        <div className="notice notice--alert">
          <strong>Poloha: </strong>
          {t.error}
        </div>
      )}

      {over && (
        <div className="notice notice--alert">
          <strong>Překročen limit </strong>
          {speed.toFixed(0)} / {settings.speedLimit} {speedUnit(u)}
        </div>
      )}

      <PressArea
        className={`trip-frame${t.frozen ? ' is-paused' : ''}`}
        label="Klepnutím vynulovat od poslední zatáčky, podržením od startu"
        onTap={() => t.resetPartial()}
        onHold={() => t.resetA()}
        ms={1000}
      >
        <div className="field field--primary">
          <span className="field-label">Od startu</span>
          <span className="field-value" style={{ '--chars': charUnits(startText) }}>
            {startText}
            <span className="field-unit">{distUnit(u)}</span>
          </span>
          <span className="field-note">
            <b>Podržet</b> 1 s = vynulovat
          </span>
        </div>

        <div className="field">
          <span className="field-label">Od poslední zatáčky</span>
          <span className="field-value" style={{ '--chars': charUnits(partialText) }}>
            {partialText}
            <span className="field-unit">{shortUnit(u)}</span>
          </span>
          <span className="field-note">
            <b>Klepnout</b> = vynulovat
          </span>
        </div>
      </PressArea>

      <div className="trip-aux">
        <div className="readout-speed">
          <span className="readout-value">{speed.toFixed(0)}</span>
          <span className="readout-unit">{speedUnit(u)}</span>
        </div>
        <button
          className={`btn ${t.frozen ? 'btn--caution' : ''}`}
          style={{ flex: 'none', minWidth: 116 }}
          onClick={() => t.toggleFreeze()}
        >
          {t.frozen ? 'Pokračovat' : 'Pauza'}
        </button>
      </div>

      <div className="trip-controls">
        <HoldButton
          className="btn"
          sub="podržet: vše"
          onTap={() => t.nudgePartial(-step)}
          onHold={() => t.nudge(-step)}
        >
          −{step} {shortUnit(u)}
        </HoldButton>
        <button className="btn" onClick={() => setSheet('nudge')}>
          ± jiné
          <span className="btn-sub">vlastní</span>
        </button>
        <HoldButton
          className="btn"
          sub="podržet: vše"
          onTap={() => t.nudgePartial(step)}
          onHold={() => t.nudge(step)}
        >
          +{step} {shortUnit(u)}
        </HoldButton>
      </div>

      {sheet === 'nudge' && (
        <NumberSheet
          title="Korekce vzdálenosti"
          hint={`Opraví „od poslední zatáčky“. Kladné přidá, záporné ubere. Jednotka: ${shortUnit(u)}.`}
          initial=""
          unit={shortUnit(u)}
          onSubmit={(v) => t.nudgePartial(shortToMeters(v))}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
