import { useState } from 'react';
import { useSettings } from '../lib/settings.jsx';
import { useTrip } from '../lib/trip.jsx';
import {
  formatDistance, distUnit, shortUnit, toSpeed, speedUnit, M_PER_FOOT,
} from '../lib/geo.js';
import { NumberSheet, HoldButton, PressArea } from '../components/ui.jsx';

export default function TripScreen() {
  const { settings } = useSettings();
  const t = useTrip();
  const [sheet, setSheet] = useState(null);
  const u = settings.units;

  const shortToMeters = (v) => (u === 'imperial' ? v * M_PER_FOOT : v);
  const partialShort = Math.round(u === 'imperial' ? t.partial / M_PER_FOOT : t.partial);
  const kmh = toSpeed(t.speed, u);
  const over = settings.speedLimit > 0 && kmh > settings.speedLimit + 1;
  const step = settings.stepShort;

  return (
    <div className="trip-screen">
      {t.error && <div className="banner bad">{t.error}</div>}

      {over && (
        <div className="banner bad center">
          Prekrocen limit: {kmh.toFixed(0)} / {settings.speedLimit} {speedUnit(u)}
        </div>
      )}

      <PressArea
        className="trip-main"
        onTap={() => t.resetPartial()}
        onHold={() => t.resetA()}
        ms={1000}
      >
        <div className="trip-num start">
          <div className="label">Od startu {t.frozen && <span className="warn">· pauza</span>}</div>
          <div className="num value">
            {formatDistance(t.tripA, u, settings.decimals)}
            <span className="unit">{distUnit(u)}</span>
          </div>
          <div className="reset-hint">podržet 1 s = vynulovat</div>
        </div>

        <div className="trip-num">
          <div className="label">Od poslední zatáčky</div>
          <div className="num value">
            {partialShort}
            <span className="unit">{shortUnit(u)}</span>
          </div>
          <div className="reset-hint">klepnutím vynulovat</div>
        </div>
      </PressArea>

      <div className="trip-speed-row">
        <div className="trip-speed">
          <span className="num">{kmh.toFixed(0)}</span>
          <span className="unit">{speedUnit(u)}</span>
        </div>
        <button
          className={`btn sm ${t.frozen ? 'warn' : ''}`}
          onClick={() => t.toggleFreeze()}
        >
          {t.frozen ? 'Pokračovat' : 'Pauza'}
        </button>
      </div>

      <div className="trip-correct">
        <HoldButton
          className="btn"
          onTap={() => t.nudgePartial(-step)}
          onHold={() => t.nudge(-step)}
        >
          −{step} {shortUnit(u)}
        </HoldButton>
        <button className="btn" onClick={() => setSheet('nudge')}>± jiné</button>
        <HoldButton
          className="btn"
          onTap={() => t.nudgePartial(step)}
          onHold={() => t.nudge(step)}
        >
          +{step} {shortUnit(u)}
        </HoldButton>
      </div>

      {sheet === 'nudge' && (
        <NumberSheet
          title="Korekce vzdálenosti"
          hint={`Opravuje "od poslední zatáčky". Kladné přidá, záporné ubere. Jednotka: ${shortUnit(u)}.`}
          initial=""
          unit={shortUnit(u)}
          onSubmit={(v) => t.nudgePartial(shortToMeters(v))}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
