import { useEffect, useState } from 'react';
import { useSettings } from '../lib/settings.jsx';
import { useTrip } from '../lib/trip.jsx';
import { formatClock, formatDistance, distUnit, toSpeed, speedUnit } from '../lib/geo.js';

export default function StageScreen() {
  const { settings } = useSettings();
  const t = useTrip();
  const u = settings.units;
  const [, setTick] = useState(0);

  // Prekresleni hodinek, i kdyz GPS zrovna nic noveho neposila.
  useEffect(() => {
    if (!t.stage.running) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 100);
    return () => clearInterval(id);
  }, [t.stage.running]);

  return (
    <>
      <div className="card odo-main center">
        <div className="label">Cas RZ {t.stage.running && <span className="warn">· bezi</span>}</div>
        <div className="num value" style={{ fontSize: 42 }}>{formatClock(t.stage.elapsedMs)}</div>
      </div>

      <div className="grid3">
        <div className="card odo-sub center">
          <div className="label">Vzdalenost</div>
          <div className="num value">{formatDistance(t.stage.dist, u, 2)}</div>
          <div className="small faint">{distUnit(u)}</div>
        </div>
        <div className="card odo-sub center">
          <div className="label">Prumer</div>
          <div className="num value">{toSpeed(t.stage.avgSpeed, u).toFixed(0)}</div>
          <div className="small faint">{speedUnit(u)}</div>
        </div>
        <div className="card odo-sub center">
          <div className="label">Max</div>
          <div className="num value">{toSpeed(t.stage.maxSpeed, u).toFixed(0)}</div>
          <div className="small faint">{speedUnit(u)}</div>
        </div>
      </div>

      <div className="grid2">
        {!t.stage.running ? (
          <button className="btn primary xl" onClick={() => t.stageStart()}>START</button>
        ) : (
          <button className="btn danger xl" onClick={() => t.stageStop()}>STOP</button>
        )}
        <button className="btn xl" onClick={() => t.stageSplit()} disabled={!t.stage.running}>MEZICAS</button>
      </div>
      <div className="grid2" style={{ marginTop: 8 }}>
        <button className="btn wide" onClick={() => t.stageReset()}>Reset RZ</button>
      </div>

      {t.stage.splits.length > 0 && (
        <div className="card">
          <div className="label" style={{ marginBottom: 8 }}>Mezicasy</div>
          {t.stage.splits.map((s, i) => (
            <div className="row" key={s.at}>
              <span className="grow">#{i + 1}</span>
              <span className="num">{formatDistance(s.dist, u, 2)} {distUnit(u)}</span>
              <span className="num" style={{ marginLeft: 12 }}>{formatClock(s.ms)}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
