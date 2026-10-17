import { useEffect, useState } from 'react';
import { useSettings } from '../lib/settings.jsx';
import { Setting, Seg, Toggle, HoldButton } from '../components/ui.jsx';

/**
 * Pole pro desetinny koeficient. Drzi rozepsanou hodnotu jako text a
 * zaokrouhli ji az pri opusteni, aby slo napsat "1.02" bez toho, aby do
 * toho pole skakalo formatovani.
 */
function DecimalField({ value, decimals, min, max, onCommit }) {
  const [text, setText] = useState(value.toFixed(decimals));

  useEffect(() => setText(value.toFixed(decimals)), [value, decimals]);

  const commit = () => {
    const n = parseFloat(text.replace(',', '.'));
    const next = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : value;
    onCommit(next);
    setText(next.toFixed(decimals));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

export default function SettingsScreen() {
  const { settings, set, reset } = useSettings();
  const u = settings.units;
  const shortUnit = u === 'imperial' ? 'stopy' : 'metry';

  return (
    <div className="settings">
      <div className="panel">
        <div className="panel-head">Měření</div>

        <Setting
          label="Kalibrace"
          hint="Násobí ujetou dráhu. 1.000 = bez korekce, 1.020 = o 2 % delší."
        >
          <DecimalField
            value={settings.calibration}
            decimals={3}
            min={0.8}
            max={1.2}
            onCommit={(v) => set({ calibration: v })}
          />
        </Setting>

        <Setting
          label="Limit přesnosti"
          hint="Horší fix se nezapočítá. Nižší hodnota = přísnější, ale v lese častěji neměří."
        >
          <input
            type="number"
            step="1"
            min="5"
            max="60"
            value={settings.maxAccuracy}
            onChange={(e) =>
              set({ maxAccuracy: Math.min(60, Math.max(5, Number(e.target.value) || 25)) })
            }
          />
        </Setting>

        <Setting label="Krok korekce" hint={`O kolik posunou tlačítka ± (${shortUnit}).`}>
          <input
            type="number"
            step="1"
            min="1"
            max="500"
            value={settings.stepShort}
            onChange={(e) => set({ stepShort: Math.max(1, Number(e.target.value) || 10) })}
          />
        </Setting>

        <Setting label="Desetinná místa" hint="U hodnoty „od startu“.">
          <Seg
            value={settings.decimals}
            onChange={(v) => set({ decimals: v })}
            options={[
              { value: 1, label: '0,0' },
              { value: 2, label: '0,00' },
              { value: 3, label: '0,000' },
            ]}
          />
        </Setting>
      </div>

      <div className="panel">
        <div className="panel-head">Zobrazení</div>

        <Setting label="Jednotky">
          <Seg
            value={settings.units}
            onChange={(v) => set({ units: v })}
            options={[
              { value: 'metric', label: 'km' },
              { value: 'imperial', label: 'mi' },
            ]}
          />
        </Setting>

        <Setting label="Režim" hint="Kokpit pro šero, Den pro ostré slunce.">
          <Seg
            value={settings.theme}
            onChange={(v) => set({ theme: v })}
            options={[
              { value: 'dark', label: 'Kokpit' },
              { value: 'light', label: 'Den' },
            ]}
          />
        </Setting>

        <Setting label="Velká tlačítka" hint="Větší dotykové plochy pro jízdu v rukavicích.">
          <Toggle on={settings.bigButtons} onChange={(v) => set({ bigButtons: v })} />
        </Setting>
      </div>

      <div className="panel">
        <div className="panel-head">Za jízdy</div>

        <Setting label="Displej nezhasne" hint="Drží obrazovku rozsvícenou.">
          <Toggle on={settings.keepAwake} onChange={(v) => set({ keepAwake: v })} />
        </Setting>

        <Setting label="Vibrace" hint="Odezva na reset a korekci.">
          <Toggle on={settings.haptics} onChange={(v) => set({ haptics: v })} />
        </Setting>

        <Setting
          label="Limit rychlosti"
          hint="Upozorní při překročení. 0 = vypnuto (seznamovací jízdy)."
        >
          <input
            type="number"
            step="5"
            min="0"
            max="250"
            value={settings.speedLimit}
            onChange={(e) => set({ speedLimit: Math.max(0, Number(e.target.value) || 0) })}
          />
        </Setting>
      </div>

      <HoldButton
        className="btn btn--alert btn--wide"
        sub="podržet pro potvrzení"
        onHold={() => reset()}
      >
        Obnovit výchozí nastavení
      </HoldButton>
    </div>
  );
}
