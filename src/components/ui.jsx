import { useEffect, useRef, useState } from 'react';

/** Spodni vysouvaci panel. Zavira se klepnutim mimo nebo tlacitkem. */
export function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="sheet-bg" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        {title && <h2>{title}</h2>}
        {children}
        <div className="row" style={{ marginTop: 14 }}>
          {footer}
          <button className="btn ghost grow" onClick={onClose}>Zavrit</button>
        </div>
      </div>
    </div>
  );
}

/** Prepinac dvou az ctyr hodnot. */
export function Seg({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Radek nastaveni s popiskem vlevo a ovladacem vpravo. */
export function Row({ label, hint, children }) {
  return (
    <div className="switch">
      <div className="grow">
        <div style={{ fontWeight: 600 }}>{label}</div>
        {hint && <div className="small faint">{hint}</div>}
      </div>
      <div style={{ flex: 'none', minWidth: 120 }}>{children}</div>
    </div>
  );
}

/** Zapinaci prepinac. */
export function Toggle({ on, onChange }) {
  return (
    <button
      className={`btn sm ${on ? 'on' : 'ghost'}`}
      style={{ width: '100%' }}
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
      {on ? 'Zapnuto' : 'Vypnuto'}
    </button>
  );
}

/** Male dialogove zadani cisla - kalibrace, nastaveni tripu, rucni korekce. */
export function NumberSheet({ title, hint, initial = '', unit, onSubmit, onClose, confirm = 'Potvrdit' }) {
  const [v, setV] = useState(String(initial));
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  const submit = () => {
    const n = parseFloat(String(v).replace(',', '.'));
    if (Number.isFinite(n)) onSubmit(n);
    onClose();
  };

  return (
    <Sheet title={title} onClose={onClose}>
      {hint && <p className="small muted" style={{ marginTop: -6 }}>{hint}</p>}
      <div className="row">
        <input
          ref={ref}
          className="grow num"
          type="text"
          inputMode="decimal"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {unit && <span className="muted" style={{ flex: 'none', fontWeight: 700 }}>{unit}</span>}
      </div>
      <button className="btn primary wide" style={{ marginTop: 12 }} onClick={submit}>{confirm}</button>
    </Sheet>
  );
}

/**
 * Tlacitko s rozlisenim kratkeho klepnuti (onTap) a podrzeni (onHold).
 * Bez onTap se chova jako puvodni "podrz a chrani" tlacitko.
 */
export function HoldButton({ onHold, onTap, children, className = 'btn', ms = 700 }) {
  const [p, setP] = useState(0);
  const timer = useRef(null);
  const start = useRef(0);
  const firedHold = useRef(false);

  const clear = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setP(0);
  };

  const begin = () => {
    if (timer.current) return;
    firedHold.current = false;
    start.current = Date.now();
    timer.current = setInterval(() => {
      const f = Math.min(1, (Date.now() - start.current) / ms);
      setP(f);
      if (f >= 1) {
        firedHold.current = true;
        clear();
        onHold();
      }
    }, 30);
  };

  const release = () => {
    const held = firedHold.current;
    clear();
    if (!held && onTap) onTap();
  };

  useEffect(() => () => clear(), []);

  return (
    <button
      className={className}
      style={p ? { background: `linear-gradient(90deg, var(--accent) ${p * 100}%, var(--bg-3) ${p * 100}%)` } : undefined}
      onPointerDown={begin}
      onPointerUp={release}
      onPointerLeave={clear}
      onPointerCancel={clear}
    >
      {children}
    </button>
  );
}

/**
 * Netlacitkova plocha s rozlisenim kratkeho klepnuti (onTap) a podrzeni (onHold).
 * Pouziva se pro velke dotykove oblasti (napr. hlavni odometr).
 */
export function PressArea({ onTap, onHold, children, className = '', ms = 1000 }) {
  const [p, setP] = useState(0);
  const timer = useRef(null);
  const start = useRef(0);
  const firedHold = useRef(false);

  const clear = () => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setP(0);
  };

  const begin = () => {
    if (timer.current) return;
    firedHold.current = false;
    start.current = Date.now();
    timer.current = setInterval(() => {
      const f = Math.min(1, (Date.now() - start.current) / ms);
      setP(f);
      if (f >= 1) {
        firedHold.current = true;
        clear();
        onHold?.();
      }
    }, 30);
  };

  const release = () => {
    const held = firedHold.current;
    clear();
    if (!held) onTap?.();
  };

  useEffect(() => () => clear(), []);

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      style={p ? { background: `linear-gradient(90deg, var(--accent-soft) ${p * 100}%, transparent ${p * 100}%)` } : undefined}
      onPointerDown={begin}
      onPointerUp={release}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onKeyDown={(e) => e.key === 'Enter' && onTap?.()}
    >
      {children}
    </div>
  );
}
