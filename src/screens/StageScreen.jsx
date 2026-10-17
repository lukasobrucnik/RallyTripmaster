import { useEffect, useState } from 'react';
import { useSettings } from '../lib/settings.jsx';
import { useTrip } from '../lib/trip.jsx';
import { formatClock, formatDistance, distUnit, toSpeed, speedUnit } from '../lib/geo.js';
import { HoldButton } from '../components/ui.jsx';

export default function StageScreen() {
  const { settings } = useSettings();
  const t = useTrip();
  const u = settings.units;
  const [, setTick] = useState(0);

  // Hodiny musi bezet i kdyz GPS zrovna nic noveho neposila.
  useEffect(() => {
    if (!t.stage.running) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [t.stage.running]);

  return (
    <div className="stage">
      <div className={`stage-panel${t.stage.running ? ' is-running' : ''}`}>
        <span className="field-label">{t.stage.running ? 'Měří se' : 'Čas RZ'}</span>
        <span className="stage-clock">{formatClock(t.stage.elapsedMs)}</span>
      </div>

      <div className="stage-metrics">
        <div className="metric">
          <span className="field-label">Vzdálenost</span>
          <span className="metric-value">{formatDistance(t.stage.dist, u, 2)}</span>
          <span className="metric-unit">{distUnit(u)}</span>
        </div>
        <div className="metric">
          <span className="field-label">Průměr</span>
          <span className="metric-value">{toSpeed(t.stage.avgSpeed, u).toFixed(0)}</span>
          <span className="metric-unit">{speedUnit(u)}</span>
        </div>
        <div className="metric">
          <span className="field-label">Maximum</span>
          <span className="metric-value">{toSpeed(t.stage.maxSpeed, u).toFixed(0)}</span>
          <span className="metric-unit">{speedUnit(u)}</span>
        </div>
      </div>

      <div className="stage-controls">
        {t.stage.running ? (
          <button className="btn btn--alert btn--lg" onClick={() => t.stageStop()}>
            Stop
          </button>
        ) : (
          <button className="btn btn--primary btn--lg" onClick={() => t.stageStart()}>
            Start
          </button>
        )}
        <button
          className="btn btn--lg"
          disabled={!t.stage.running}
          onClick={() => t.stageSplit()}
        >
          Mezičas
        </button>
      </div>

      <HoldButton
        className="btn btn--alert btn--wide"
        sub="podržet pro potvrzení"
        onHold={() => t.stageReset()}
      >
        Vynulovat RZ
      </HoldButton>

      <div className="splits">
        <div className="splits-head">
          <span className="grow">Mezičasy</span>
          <span className="tnum">{t.stage.splits.length}</span>
        </div>
        {t.stage.splits.length === 0 ? (
          <div className="empty">
            Zatím žádné mezičasy. Zaznamenáš je tlačítkem Mezičas za jízdy.
          </div>
        ) : (
          t.stage.splits.map((s, i) => (
            <div className="split-row" key={s.at}>
              <span className="split-idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="split-dist">
                {formatDistance(s.dist, u, 2)} {distUnit(u)}
              </span>
              <span className="split-time">{formatClock(s.ms)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
