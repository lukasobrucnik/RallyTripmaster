import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Rozlisi kratke klepnuti od podrzeni a hlasi prubeh podrzeni (0-1),
 * aby slo vykreslit presnou indikaci misto odhadu.
 */
function usePressGesture({ onTap, onHold, ms }) {
  const [progress, setProgress] = useState(0);
  const timer = useRef(null);
  const start = useRef(0);
  const held = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setProgress(0);
  }, []);

  const begin = useCallback(() => {
    if (timer.current) return;
    held.current = false;
    start.current = Date.now();
    timer.current = setInterval(() => {
      const f = Math.min(1, (Date.now() - start.current) / ms);
      setProgress(f);
      if (f >= 1) {
        held.current = true;
        clear();
        onHold?.();
      }
    }, 30);
  }, [clear, ms, onHold]);

  const release = useCallback(() => {
    const wasHeld = held.current;
    clear();
    if (!wasHeld) onTap?.();
  }, [clear, onTap]);

  useEffect(() => clear, [clear]);

  return {
    progress,
    handlers: {
      onPointerDown: begin,
      onPointerUp: release,
      onPointerLeave: clear,
      onPointerCancel: clear,
    },
  };
}

/** Indikace podrzeni - linka plnici se po spodni hrane plochy. */
function PressFill({ progress }) {
  if (!progress) return null;
  return <span className="press-fill" style={{ transform: `scaleX(${progress})` }} />;
}

/**
 * Tlacitko s rozlisenim kratkeho klepnuti (onTap) a podrzeni (onHold).
 * Bez onTap se chova jako cisté "podrz a potvrd" tlacitko.
 */
export function HoldButton({ onHold, onTap, children, sub, className = 'btn', ms = 700 }) {
  const { progress, handlers } = usePressGesture({ onTap, onHold, ms });

  return (
    <button className={className} {...handlers}>
      {children}
      {sub && <span className="btn-sub">{sub}</span>}
      <PressFill progress={progress} />
    </button>
  );
}

/**
 * Netlacitkova plocha s rozlisenim klepnuti a podrzeni - pro velke
 * dotykove zony, kde je ovladacim prvkem cely udaj.
 */
export function PressArea({ onTap, onHold, children, className = '', ms = 1000, label }) {
  const { progress, handlers } = usePressGesture({ onTap, onHold, ms });

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(e) => e.key === 'Enter' && onTap?.()}
      {...handlers}
    >
      {children}
      <PressFill progress={progress} />
    </div>
  );
}

/** Spodni vysouvaci panel. Zavira se klepnutim mimo nebo tlacitkem. */
export function Sheet({ title, onClose, children, footer }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div
      className="sheet-scrim"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        {title && <h2>{title}</h2>}
        {children}
        <div className="cluster" style={{ marginTop: 14 }}>
          {footer}
          <button className="btn btn--ghost grow" onClick={onClose}>
            Zavřít
          </button>
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
        <button
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Radek nastaveni - popis vlevo, ovladac vpravo. */
export function Setting({ label, hint, children }) {
  return (
    <div className="setting">
      <div className="setting-text">
        <div className="setting-name">{label}</div>
        {hint && <div className="setting-hint">{hint}</div>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

/** Zapinaci prepinac. */
export function Toggle({ on, onChange }) {
  return (
    <button
      className={`btn btn--sm btn--wide ${on ? 'btn--active' : 'btn--ghost'}`}
      aria-pressed={on}
      onClick={() => onChange(!on)}
    >
      {on ? 'Zapnuto' : 'Vypnuto'}
    </button>
  );
}

/** Male dialogove zadani cisla - korekce, kalibrace, nastaveni citace. */
export function NumberSheet({
  title,
  hint,
  initial = '',
  unit,
  onSubmit,
  onClose,
  confirm = 'Potvrdit',
}) {
  const [v, setV] = useState(String(initial));
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const submit = () => {
    const n = parseFloat(String(v).replace(',', '.'));
    if (Number.isFinite(n)) onSubmit(n);
    onClose();
  };

  return (
    <Sheet title={title} onClose={onClose}>
      {hint && <p className="sheet-hint">{hint}</p>}
      <div className="cluster">
        <input
          ref={ref}
          className="grow"
          type="text"
          inputMode="decimal"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        {unit && <span className="readout-unit">{unit}</span>}
      </div>
      <button className="btn btn--primary btn--wide" style={{ marginTop: 12 }} onClick={submit}>
        {confirm}
      </button>
    </Sheet>
  );
}
