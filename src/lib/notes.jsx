import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { load, save } from './storage.js';

const Ctx = createContext(null);

/**
 * Paleta znacek pro rychly zapis rozpisu pri najizdeni.
 * Cisla 1-6 jsou bezna stupnice ostrosti (1 = nejostrejsi).
 */
export const SYMBOLS = [
  { g: 'Vlevo', items: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] },
  { g: 'Vpravo', items: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'] },
  { g: 'Ostre', items: ['HL', 'HR', 'SqL', 'SqR', 'LL', 'RR'] },
  { g: 'Tvar', items: ['dlouha', 'zkracuje', 'otevira', 'dvojita', 'do kopce', 's kopce'] },
  { g: 'Povrch', items: ['most', 'skok', 'vlna', 'rigol', 'vymol', 'sterk'] },
  { g: 'Provoz', items: ['krizovatka', 'kamen', 'prikop', 'pozor', 'uzke', 'STOP'] },
];

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function NotesProvider({ children }) {
  const [name, setName] = useState(() => load('notesName', 'RZ 1'));
  const [entries, setEntries] = useState(() => load('notesEntries', []));
  const [archives, setArchives] = useState(() => load('notesArchives', []));

  useEffect(() => { save('notesName', name); }, [name]);
  useEffect(() => { save('notesEntries', entries); }, [entries]);
  useEffect(() => { save('notesArchives', archives); }, [archives]);

  const api = useMemo(() => ({
    name,
    setName,
    entries,
    archives,

    /** Zapise bod rozpisu. gap = metru od predchoziho bodu, odo = stav tripu. */
    add({ gap, odo, symbol = '', text = '' }) {
      const e = { id: newId(), at: Date.now(), gap, odo, symbol, text };
      setEntries((list) => [...list, e]);
      return e.id;
    },
    update(id, patch) {
      setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    remove(id) {
      setEntries((list) => list.filter((e) => e.id !== id));
    },
    removeLast() {
      setEntries((list) => list.slice(0, -1));
    },
    clear() {
      setEntries([]);
    },
    /** Odlozi aktualni rozpis do archivu a zacne prazdny. */
    archive() {
      if (!entries.length) return;
      setArchives((a) => [{ id: newId(), name, at: Date.now(), entries }, ...a].slice(0, 50));
      setEntries([]);
    },
    restore(id) {
      const a = archives.find((x) => x.id === id);
      if (!a) return;
      setName(a.name);
      setEntries(a.entries);
    },
    deleteArchive(id) {
      setArchives((a) => a.filter((x) => x.id !== id));
    },
  }), [name, entries, archives]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useNotes() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useNotes mimo NotesProvider');
  return v;
}

/** Rozpis jako text pro spolujezdce - "350 R4 dlouha". */
export function notesToText(name, entries) {
  const head = `${name}  (${entries.length} bodu)`;
  const body = entries
    .map((e) => [String(Math.round(e.gap)).padStart(5, ' '), e.symbol || '-', e.text || ''].join(' ').trimEnd())
    .join('\n');
  return `${head}\n${body}\n`;
}

/** CSV pro dalsi zpracovani v tabulce. */
export function notesToCsv(entries) {
  const rows = [['poradi', 'od_predchozi_m', 'odometr_m', 'znacka', 'poznamka']];
  entries.forEach((e, i) => {
    rows.push([i + 1, Math.round(e.gap), Math.round(e.odo), e.symbol || '', (e.text || '').replace(/"/g, "''")]);
  });
  return rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
}
