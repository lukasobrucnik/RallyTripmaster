import { useSettings, DEFAULT_SETTINGS } from '../lib/settings.jsx';
import { Row, Seg, Toggle } from '../components/ui.jsx';

export default function SettingsScreen() {
  const { settings, set, reset } = useSettings();

  return (
    <>
      <div className="card">
        <Row label="Jednotky">
          <Seg
            value={settings.units}
            onChange={(v) => set({ units: v })}
            options={[
              { value: 'metric', label: 'km' },
              { value: 'imperial', label: 'mi' },
            ]}
          />
        </Row>
        <Row label="Tema">
          <Seg
            value={settings.theme}
            onChange={(v) => set({ theme: v })}
            options={[
              { value: 'dark', label: 'Tmave' },
              { value: 'light', label: 'Svetle' },
            ]}
          />
        </Row>
        <Row label="Velka tlacitka" hint="Vetsi ovladaci plochy pro jizdu">
          <Toggle on={settings.bigButtons} onChange={(v) => set({ bigButtons: v })} />
        </Row>
        <Row label="Drzet obrazovku rozsvicenou">
          <Toggle on={settings.keepAwake} onChange={(v) => set({ keepAwake: v })} />
        </Row>
        <Row label="Vibrace">
          <Toggle on={settings.haptics} onChange={(v) => set({ haptics: v })} />
        </Row>
      </div>

      <div className="card">
        <Row label="Limit rychlosti" hint="km/h, 0 = vypnuto (rezim seznamovacich jizd)">
          <input
            className="num"
            style={{ width: '100%' }}
            type="number"
            min="0"
            value={settings.speedLimit}
            onChange={(e) => set({ speedLimit: Math.max(0, Number(e.target.value) || 0) })}
          />
        </Row>
        <Row label="Krok rucni korekce" hint="metry">
          <input
            className="num"
            style={{ width: '100%' }}
            type="number"
            min="1"
            value={settings.stepShort}
            onChange={(e) => set({ stepShort: Math.max(1, Number(e.target.value) || 1) })}
          />
        </Row>
        <Row label="Desetinna mista" hint="hlavni odometr">
          <input
            className="num"
            style={{ width: '100%' }}
            type="number"
            min="0"
            max="3"
            value={settings.decimals}
            onChange={(e) => set({ decimals: Math.min(3, Math.max(0, Number(e.target.value) || 0)) })}
          />
        </Row>
      </div>

      <button className="btn danger wide" onClick={() => reset()}>
        Obnovit vychozi nastaveni
      </button>
      <div className="small faint" style={{ padding: '0 4px', marginTop: 4 }}>
        Vychozi: {DEFAULT_SETTINGS.units === 'metric' ? 'metricke' : 'imperialni'} jednotky,
        limit vypnuty.
      </div>
    </>
  );
}
